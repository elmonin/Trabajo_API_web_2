import express from 'express';
import { routerProductos } from './routes/index.js';

const app = express();

app.use(express.json());


app.use((req, res, next) => {
    console.log('middleware');
    next();
})

routerProductos(app)

app.listen(3002, () => {
    console.log('Server is running on port 3002');
})