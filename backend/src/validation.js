export const validationError = (res, errors, message = "Datos inválidos.") =>
    res.status(422).json({ message, errors });
