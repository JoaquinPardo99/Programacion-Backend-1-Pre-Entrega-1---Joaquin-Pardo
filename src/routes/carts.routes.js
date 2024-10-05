import { Router } from "express";
import fs from "fs/promises";
import path from "path";

const router = Router();
const cartsFile = path.join("src/data/carts.json");
const productsFile = path.join("src/data/products.json");

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

const readProducts = async () => {
  try {
    const data = await fs.readFile(productsFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo productos:", error);
    return [];
  }
};

router.post("/", async (req, res) => {
  try {
    const carts = await readCarts();
    const newId = carts.length ? carts[carts.length - 1].id + 1 : 1;
    const newCart = { id: newId, products: [] };
    carts.push(newCart);
    await writeCarts(carts);
    res.status(201).json(newCart);
  } catch (error) {
    res.status(500).json({ error: "Error al crear carrito" });
  }
});

router.post("/:cid/product/:pid", async (req, res) => {
  try {
    const carts = await readCarts();
    const products = await readProducts();
    const cart = carts.find((c) => c.id == req.params.cid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    const product = products.find((p) => p.id == req.params.pid);
    if (!product) {
      return res
        .status(404)
        .json({ error: "Producto no encontrado en la lista de productos" });
    }

    const productIndex = cart.products.findIndex(
      (p) => p.product == req.params.pid
    );
    if (productIndex === -1) {
      cart.products.push({ product: req.params.pid, quantity: 1 });
    } else {
      cart.products[productIndex].quantity++;
    }

    await writeCarts(carts);
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: "Error al agregar producto al carrito" });
  }
});

router.get("/:cid", async (req, res) => {
  try {
    const carts = await readCarts();
    const products = await readProducts();
    const cart = carts.find((c) => c.id == req.params.cid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    const cartWithProductDetails = cart.products.map((item) => {
      const productDetails = products.find((p) => p.id == item.product);
      return {
        product: productDetails
          ? productDetails
          : { error: "Producto no encontrado" },
        quantity: item.quantity,
      };
    });

    res.json({ id: cart.id, products: cartWithProductDetails });
  } catch (error) {
    res.status(500).json({ error: "Error al leer el carrito" });
  }
});

router.delete("/:cid/product/:pid", async (req, res) => {
  try {
    const carts = await readCarts();
    const cart = carts.find((c) => c.id == req.params.cid);
    if (!cart) return res.status(404).json({ error: "Carrito no encontrado" });

    cart.products = cart.products.filter(
      (item) => item.product != req.params.pid
    );

    await writeCarts(carts);
    res.json({ message: "Producto eliminado del carrito", cart });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar producto del carrito" });
  }
});

export default router;
