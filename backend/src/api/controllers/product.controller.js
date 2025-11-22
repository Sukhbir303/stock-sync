const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Create a new product
 * @route   POST /api/products
 */
exports.createProduct = async (req, res, next) => {
  try {
    const { 
      name, 
      skuCode, 
      description, 
      category, 
      uom, 
      reorderLevel,
      brand,
      unitCost,
      sellingPrice,
      barcode
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        skuCode,
        description,
        category,
        uom,
        reorderLevel: reorderLevel ? parseInt(reorderLevel) : null,
        brand,
        unitCost: unitCost ? parseFloat(unitCost) : null,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : null,
        barcode: barcode || null
      }
    });

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all products
 * @route   GET /api/products
 */
exports.getProducts = async (req, res, next) => {
  try {
    const { category, search, isActive } = req.query;

    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { skuCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLevels: {
          include: {
            location: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Sanitize optional unique fields
    if (updateData.barcode === '') {
      updateData.barcode = null;
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete product (Hard Delete)
 * @route   DELETE /api/products/:id
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Delete the product (Cascade will remove related StockLevels and StockLedger)
    await prisma.product.delete({
      where: { id }
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

