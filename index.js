import express from 'express';
import { read, write } from './src/utils/files.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url'; 
import Joi from 'joi'; 
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const productoSchema = Joi.object({
    nombre: Joi.string().min(3).required().messages({
        'string.base': '"nombre" debe ser un texto',
        'string.min': '"nombre" debe tener al menos 3 caracteres',
        'any.required': '"nombre" es obligatorio'
    }),
    descripcion: Joi.string().min(5).required().messages({
        'string.base': '"descripcion" debe ser un texto',
        'string.min': '"descripcion" debe tener al menos 5 caracteres',
        'any.required': '"descripcion" es obligatorio'
    })
});

const validarProducto = (producto) => {
    return productoSchema.validate(producto);
};

app.get('/productos', (req, res) => {
    const productos = read();
    console.log('productos', productos);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(productos));
});

app.get('/productos/:id', (req, res) => {
    const productos = read();
    const producto = productos.find(producto => producto.id === parseInt(req.params.id));
    if (producto) {
        res.json(producto);
    } else {
        res.status(404).end();
    }
});

app.post('/productos', (req, res) => {
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

app.put('/productos/:id', (req, res) => {
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

app.delete('/productos/:id', (req, res) => {
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

app.listen(3002, () => {
    console.log('Server is running on port 3002');
});