import dayjs from "dayjs";

export const codigoRegistro = (req, res, next) => {
    const currentDataTime = dayjs().format('HH:mm DD-MM-YYYY');

    req.body.ip = req.ip;
    if(req.method === 'POST') {
        req.body.created_at = currentDataTime;
    } else if (req.method === 'PUT') {
        req.body.update_at = currentDataTime;
    }

    next();
}







//PUT: Ruta para actualizar la información de una productoo (El que tenga el ID de la ruta).
