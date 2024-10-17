import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

const productsFile = path.join(__dirname, "data/products.json");

const readProducts = async () => {
  try {
    const data = await fs.readFile(productsFile, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error al leer los productos:", error);
    return [];
  }
};

const writeProducts = async (products) => {
  try {
    await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error("Error al guardar los productos:", error);
  }
};

app.get("/", async (req, res) => {
  try {
    const products = await readProducts();
    res.render("home", { products });
  } catch (error) {
    console.error("Error en la ruta /:", error);
    res.status(500).send("Error al cargar los productos");
  }
});

app.get("/realtimeproducts", async (req, res) => {
  try {
    const products = await readProducts();
    res.render("realTimeProducts", { products });
  } catch (error) {
    console.error("Error en la ruta /realtimeproducts:", error);
    res.status(500).send("Error al cargar los productos");
  }
});

const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

io.on("connection", (socket) => {
  console.log("Nuevo cliente conectado");

  const sendUpdatedProducts = async () => {
    const products = await readProducts();
    socket.emit("productosActualizados", products);
  };

  sendUpdatedProducts();

  socket.on("nuevoProducto", async (producto) => {
    try {
      const products = await readProducts();
      products.push(producto);
      await writeProducts(products);

      io.emit("productosActualizados", products);
    } catch (error) {
      console.error("Error al agregar el producto:", error);
    }
  });

  socket.on("eliminarProducto", async (product) => {
    try {
      let products = await readProducts();
      products = products.filter((p) => p.id !== parseInt(product.id));
      await writeProducts(products);

      io.emit("productosActualizados", products);

      console.log(`Producto eliminado: ${product.title}`);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("Cliente desconectado");
  });
});
