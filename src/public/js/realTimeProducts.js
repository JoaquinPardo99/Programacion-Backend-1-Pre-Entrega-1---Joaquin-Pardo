const socket = io();

socket.on("productosActualizados", (productos) => {
  const productGrid = document.getElementById("product-grid");
  productGrid.innerHTML = "";

  productos.forEach((producto) => {
    const productCard = document.createElement("div");
    productCard.setAttribute("data-id", producto.id);
    productCard.setAttribute("data-title", producto.title);
    productCard.classList.add("product-card");
    productCard.style.border = "1px solid #ddd";
    productCard.style.padding = "10px";
    productCard.style.margin = "10px";
    productCard.style.width = "200px";

    productCard.innerHTML = `
      <h3>${producto.title}</h3>
      <p><strong>Descripción:</strong> ${producto.description}</p>
      <p><strong>Código:</strong> ${producto.code}</p>
      <p><strong>Precio:</strong> $${producto.price}</p>
      <p><strong>Stock:</strong> ${producto.stock}</p>
      <p><strong>Categoría:</strong> ${producto.category}</p>
      <button class="delete">Eliminar</button>
    `;

    productGrid.appendChild(productCard);
  });
});

document
  .getElementById("addProductForm")
  .addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const code = document.getElementById("code").value;
    const price = document.getElementById("price").value;
    const stock = document.getElementById("stock").value;
    const category = document.getElementById("category").value;

    if (!title || !description || !code || !price || !stock || !category) {
      Swal.fire({
        title: "Error",
        text: "Todos los campos son obligatorios.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    if (parseFloat(price) < 0) {
      Swal.fire({
        title: "Error",
        text: "El precio no puede ser negativo.",
        icon: "error",
        confirmButtonText: "OK",
      });
      return;
    }

    const newProduct = {
      id: Date.now(),
      title,
      description,
      code,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
      category,
    };

    socket.emit("nuevoProducto", newProduct);

    Swal.fire({
      title: "Producto agregado",
      text: `Se agregó ${newProduct.title}`,
      icon: "success",
      confirmButtonText: "OK",
    });

    document.getElementById("addProductForm").reset();
  });

document.getElementById("product-grid").addEventListener("click", (event) => {
  if (event.target.classList.contains("delete")) {
    const productCard = event.target.closest(".product-card");
    const productId = productCard.getAttribute("data-id");
    const productTitle = productCard.getAttribute("data-title");

    socket.emit("eliminarProducto", { id: productId, title: productTitle });

    Swal.fire({
      title: "Producto eliminado",
      text: `El producto "${productTitle}" ha sido eliminado.`,
      icon: "warning",
      confirmButtonText: "OK",
    });
  }
});
