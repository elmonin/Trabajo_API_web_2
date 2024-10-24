import express from "express";
import PDFDocument from 'pdfkit';
import {read, write } from "../src/utils/files.js";
import Joi from 'joi';
import path from 'path';
import fs from 'fs';
export const productosFileRouter = express.Router();
import { codigoRegistro } from '../middleware/middleware.js';


const productoSchema = Joi.object({
    nombre: Joi.string().required(),
    descripcion: Joi.string().optional(),
    precio: Joi.number().required(),
    categoria: Joi.string().optional(),
    ip: Joi.string().optional()
});

productosFileRouter.get('/',(req, res) => {
    let productos = read();

    const {filtrardato, dato, limit } = req.query;

    if (filtrardato && dato){
        productos = productos.filter(producto => producto[filtrardato] && producto[filtrardato].toString().toLowerCase() === dato.toLowerCase());
    }

    if(limit){
        productos = productos.slice(0, parseInt(limit));
    }

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(productos));
})

productosFileRouter.use(codigoRegistro);

productosFileRouter.get('/', (req, res) => {
    const productos = read();
    console.log('productos', productos);
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(productos));
});

productosFileRouter.get('/:id', (req, res) => {
    const productos = read();
    const producto = productos.find(producto => producto.id === parseInt(req.params.id));
    if (producto) {
        res.json(producto);
    } else {
        res.status(404).end();
    }
});

productosFileRouter.post('/', (req, res) => {

    const productos = read();
    const producto = {
        ...req.body,
        id: productos.length + 1
    };
    productos.push(producto);
    write(productos);
    res.status(201).json(productos);
});

// PUT: Para cambiar un campo específico de todos los registros
productosFileRouter.put('/updall', (req, res) => {
    const productos = read(); // Leer todos los registros

    // Extraer el campo y el valor del cuerpo de la solicitud
    const { field, value } = req.body; 

    // Validar si el campo y el valor están presentes
    if (!field || value === undefined) {
        return res.status(400).json({ message: 'El campo y el valor son requeridos.' });
    }

    // Verificar que hay registros para actualizar
    if (!Array.isArray(productos) || productos.length === 0) {
        return res.status(404).json({ message: 'No se encontraron registros para actualizar.' });
    }

    // Actualizar el campo especificado en todos los registros
    productos.forEach(producto => {
        producto[field] = value; // Cambiar el campo al nuevo valor
        producto.updated_at = dayjs().format('HH:mm DD-MM-YYYY'); // Actualizar la fecha
    });

    // Intentar guardar los registros actualizados
    try {
        write(productos); // Guardar los registros actualizados
        res.json({ message: 'Todos los registros han sido actualizados', updatedRecords: productos }); // Enviar los registros actualizados como respuesta
    } catch (error) {
        console.error('Error al escribir el archivo:', error);
        res.status(500).json({ message: 'Error al guardar los registros.' });
    }
});

productosFileRouter.put('/:id', (req, res) => {
    const { error } = productoSchema.validate(req.body);
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