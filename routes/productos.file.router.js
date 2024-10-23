import express from "express";
import PDFDocument from 'pdfkit';
import {read, write } from "../src/utils/files.js";


const validarProducto = (producto) => {
    return productoSchema.validate(producto);
};

export const productosFileRouter = express.Router();


productosFileRouter.get('/', (req, res) => {
    const productos = read();
    console.log('productos', productos);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(productos));
});

productosFileRouter.get(':id', (req, res) => {
    const productos = read();
    const producto = productos.find(producto => producto.id === parseInt(req.params.id));
    if (producto) {
        res.json(producto);
    } else {
        res.status(404).end();
    }
});

productosFileRouter.post('/', (req, res) => {
    const { error } = validarProducto(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details[0].message
        });
    }

    const productos = read();
    const producto = {
        ...req.body,
        id: productos.length + 1
    };
    productos.push(producto);
    write(productos);
    res.status(201).json(productos);
});

productosFileRouter.put('/:id', (req, res) => {
    const { error } = validarProducto(req.body);
    if (error) {
        return res.status(400).json({
            message: error.details[0].message
        });
    }

    const productos = read();
    let producto = productos.find(producto => producto.id === parseInt(req.params.id));
    if (producto) {
        producto = {
            ...producto,
            ...req.body
        };
        productos[productos.findIndex(producto => producto.id === parseInt(req.params.id))] = producto;
        write(productos);
        res.json(producto);
    } else {
        res.status(404).end();
    }
});

productosFileRouter.delete('/:id', (req, res) => {
    const productos = read();
    const producto = productos.find(producto => producto.id === parseInt(req.params.id));

    if (producto) {
        productos.splice(
            productos.findIndex(producto => producto.id === parseInt(req.params.id)),
            1
        );
        write(productos);

        const doc = new PDFDocument();
        const pdfsFolder = path.join(__dirname, 'pdfs'); 

        if (!fs.existsSync(pdfsFolder)) {
            fs.mkdirSync(pdfsFolder);
        }

        const filePath = path.join(pdfsFolder, `Producto-Eliminado-${producto.id}.pdf`);
        const writeStream = fs.createWriteStream(filePath);

        doc.text(`Producto Eliminado:`);
        doc.text(`ID: ${producto.id}`);
        doc.text(`Nombre: ${producto.nombre || 'Sin nombre'}`);
        doc.text(`Descripción: ${producto.descripcion || 'Sin descripción'}`);
        doc.text(`Fecha de eliminación: ${new Date().toLocaleString()}`);

        doc.pipe(writeStream);

        doc.end();

        writeStream.on('finish', () => {
            res.json({
                message: 'Producto eliminado y PDF generado',
                pdfPath: filePath
            });
        });

        writeStream.on('error', (err) => {
            res.status(500).json({
                message: 'Error al generar el PDF',
                error: err
            });
        });

    } else {
        res.status(404).end();
    }
});