import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { upload } from "../utils.js";

const router = Router();
const productsFile = path.join("src/data/products.json");
const cartsFile = path.join("src/data/carts.json");

const readProducts = async () => {
  try {
    const data = await fs.readFile(productsFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo los productos:", error);
    return [];
  }
};

const writeProducts = async (products) => {
  try {
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error escribiendo los productos:", error);
  }
};

const readCarts = async () => {
  try {
    await fs.access(cartsFile);
  } catch (error) {
    await fs.writeFile(cartsFile, JSON.stringify([]));
  }
  const data = await fs.readFile(cartsFile, "utf-8");
  return JSON.parse(data);
};

const writeCarts = async (carts) => {
  await fs.writeFile(cartsFile, JSON.stringify(carts, null, 2));
};

router.get("/", async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (error) {
    console.error("Error en GET /api/products:", error);
    res.status(500).json({ error: "Error al leer productos" });
  }
});

router.get("/:pid", async (req, res) => {
  try {
    const products = await readProducts();
    const product = products.find((p) => p.id == req.params.pid);
    if (product) res.json(product);
    else res.status(404).json({ error: "Producto no encontrado" });
  } catch (error) {
    console.error(`Error en GET /api/products/${req.params.pid}:`, error);
    res.status(500).json({ error: "Error al leer producto" });
  }
});

router.post("/", upload.array("thumbnails", 5), async (req, res) => {
  const { title, description, code, price, stock, category } = req.body;

  if (!title || !description || !code || !price || !stock || !category) {
    return res.status(400).json({ error: "Faltan campos obligatorios" });
  }

  try {
    const products = await readProducts();
    const newId = products.length ? products[products.length - 1].id + 1 : 1;

    const thumbnails =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.path)
        : [];

    const newProduct = {
      id: newId,
      title,
      description,
      code,
      price,
      status: true,
      stock,
      category,
      thumbnails,
    };

    products.push(newProduct);
    await writeProducts(products);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error("Error en POST /api/products:", error);
    res.status(500).json({ error: "Error al agregar producto" });
  }
});

router.put("/:pid", async (req, res) => {
  try {
    const products = await readProducts();
    const index = products.findIndex((p) => p.id == req.params.pid);
    if (index === -1) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const updatedProduct = {
      ...products[index],
      ...req.body,
      id: products[index].id,
    };
    products[index] = updatedProduct;
    await writeProducts(products);
    res.json(updatedProduct);
  } catch (error) {
    console.error(`Error en PUT /api/products/${req.params.pid}:`, error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

router.delete("/:pid", async (req, res) => {
  try {
    const products = await readProducts();
    const carts = await readCarts();
    const updatedProducts = products.filter((p) => p.id != req.params.pid);

    if (updatedProducts.length === products.length) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const updatedCarts = carts.map((cart) => {
      cart.products = cart.products.filter(
        (item) => item.product != req.params.pid
      );
      return cart;
    });

    await writeProducts(updatedProducts);
    await writeCarts(updatedCarts);

    res.json({ message: "Producto y carritos actualizados" });
  } catch (error) {
    console.error(`Error en DELETE /api/products/${req.params.pid}:`, error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

export default router;
