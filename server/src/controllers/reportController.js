const prisma = require('../config/prisma');
const XLSX = require('xlsx');
const { generateSalesReportWorkbook } = require('../utils/excelHelper');

/**
 * T-03: Helper format tanggal ke format lokal YYYY-MM-DD
 * Mencegah pergeseran tanggal akibat konversi UTC toISOString()
 */
function toLocalDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get Dashboard KPIs and Chart Visualizations
async function getDashboardAnalytics(req, res, next) {
  try {
    const now = new Date();

    // Start of today (berdasarkan waktu lokal)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Start of yesterday (berdasarkan waktu lokal)
    const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, -1);

    // Start of this month (berdasarkan waktu lokal)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // 1. KPI Queries in parallel
    const [
      todaySales,
      yesterdaySales,
      monthSales,
      totalProducts,
      allProducts,
      recentTransactions,
    ] = await Promise.all([
      // Today sales
      prisma.transaction.aggregate({
        where: { date: { gte: startOfToday } },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      // Yesterday sales
      prisma.transaction.aggregate({
        where: {
          date: {
            gte: startOfYesterday,
            lte: endOfYesterday,
          },
        },
        _sum: { finalAmount: true },
      }),
      // This month sales
      prisma.transaction.aggregate({
        where: { date: { gte: startOfMonth } },
        _sum: { finalAmount: true },
        _count: { id: true },
      }),
      // Total active products count
      prisma.product.count({ where: { isActive: true } }),
      // All products to evaluate low stock
      prisma.product.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { stock: 'asc' },
      }),
      // Recent 5 transactions
      prisma.transaction.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { items: true },
      }),
    ]);

    const lowStockProducts = allProducts.filter((p) => p.stock <= p.minStock);

    const todayRevenue = Number(todaySales._sum.finalAmount || 0);
    const yesterdayRevenue = Number(yesterdaySales._sum.finalAmount || 0);
    const monthRevenue = Number(monthSales._sum.finalAmount || 0);
    const todayTransactionsCount = todaySales._count.id || 0;
    const monthTransactionsCount = monthSales._count.id || 0;

    // Daily revenue trend (Last 7 days sesuai tanggal lokal)
    const sevenDaysAgo = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate() - 6, 0, 0, 0, 0);

    const rawTransactionsLast7Days = await prisma.transaction.findMany({
      where: { date: { gte: sevenDaysAgo } },
      select: { date: true, finalAmount: true, totalAmount: true },
      orderBy: { date: 'asc' },
    });

    const daysMap = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo.getFullYear(), sevenDaysAgo.getMonth(), sevenDaysAgo.getDate() + i);
      const dateStr = toLocalDateKey(d);
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      daysMap.set(dateStr, { date: dateStr, label, revenue: 0, transactions: 0 });
    }

    rawTransactionsLast7Days.forEach((t) => {
      const dateStr = toLocalDateKey(t.date);
      if (daysMap.has(dateStr)) {
        const item = daysMap.get(dateStr);
        item.revenue += Number(t.finalAmount);
        item.transactions += 1;
      }
    });

    const salesTrend = Array.from(daysMap.values());

    // Top Selling Products (Aggregated from TransactionItem)
    const topItemsRaw = await prisma.transactionItem.groupBy({
      by: ['productId', 'productName'],
      _sum: {
        quantity: true,
        subtotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 7,
    });

    const topSelling = topItemsRaw.map((item) => ({
      name: item.productName,
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: Number(item._sum.subtotal || 0),
    }));

    // Category distribution (Group by category of products sold or in catalog)
    const categoriesWithCount = await prisma.category.findMany({
      include: {
        products: {
          select: { stock: true, sellPrice: true },
        },
      },
    });

    const categoryDistribution = categoriesWithCount.map((cat) => ({
      name: cat.name,
      productCount: cat.products.length,
      totalStock: cat.products.reduce((acc, curr) => acc + curr.stock, 0),
    }));

    res.json({
      success: true,
      data: {
        kpis: {
          todayRevenue,
          yesterdayRevenue,
          monthRevenue,
          todayTransactionsCount,
          monthTransactionsCount,
          totalProducts,
          lowStockCount: lowStockProducts.length,
        },
        salesTrend,
        topSelling,
        categoryDistribution,
        lowStockProducts: lowStockProducts.slice(0, 10),
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Get Sales Report Data with date filters & profit calculation
async function getSalesReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    const isValidDate = (d) => d && d !== 'undefined' && d !== 'null' && !isNaN(new Date(d).getTime());

    if (isValidDate(startDate)) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.date = where.date || {};
      where.date.gte = start;
    }
    if (isValidDate(endDate)) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = where.date || {};
      where.date.lte = end;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: { date: 'desc' },
    });

    // Calculations
    let totalRevenue = 0;
    let totalDiscount = 0;
    let totalCost = 0;
    let totalItemsSold = 0;

    const paymentMethodsSummary = {
      CASH: { count: 0, amount: 0 },
      QRIS: { count: 0, amount: 0 },
      TRANSFER: { count: 0, amount: 0 },
    };

    transactions.forEach((tx) => {
      totalRevenue += Number(tx.finalAmount);
      totalDiscount += Number(tx.discountAmount);

      const method = tx.paymentMethod || 'CASH';
      if (!paymentMethodsSummary[method]) {
        paymentMethodsSummary[method] = { count: 0, amount: 0 };
      }
      paymentMethodsSummary[method].count += 1;
      paymentMethodsSummary[method].amount += Number(tx.finalAmount);

      if (tx.items) {
        tx.items.forEach((item) => {
          totalItemsSold += item.quantity;
          totalCost += Number(item.costPrice) * item.quantity;
        });
      }
    });

    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalTransactions: transactions.length,
          totalRevenue,
          totalDiscount,
          totalCost,
          grossProfit,
          profitMargin: parseFloat(profitMargin),
          totalItemsSold,
          paymentMethodsSummary,
        },
        transactions,
      },
    });
  } catch (err) {
    next(err);
  }
}

// Export Sales Report to Excel
async function exportSalesExcel(req, res, next) {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    const isValidDate = (d) => d && d !== 'undefined' && d !== 'null' && !isNaN(new Date(d).getTime());

    if (isValidDate(startDate)) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.date = where.date || {};
      where.date.gte = start;
    }
    if (isValidDate(endDate)) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.date = where.date || {};
      where.date.lte = end;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { items: true },
      orderBy: { date: 'desc' },
    });

    const wb = generateSalesReportWorkbook(transactions);
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const timestamp = toLocalDateKey(new Date());
    res.setHeader('Content-Disposition', `attachment; filename="Laporan_Penjualan_ATK_${timestamp}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardAnalytics,
  getSalesReport,
  exportSalesExcel,
};
