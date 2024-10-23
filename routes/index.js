import express from "express";
import { productosFileRouter } from "./productos.file.router.js";

const router = express.Router();

export function routerProductos(app) {
    app.use("/api/v1", router);

    router.use("/file/productos", productosFileRouter);
}