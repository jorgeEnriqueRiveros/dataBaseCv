const express = require("express");
const path = require('path');
const {swaggerDocs: v1SwaggerDocs} = require('./swagger');
const fs = require('fs').promises;
const { Pool } = require("pg");
const app = express();
const bodyParser = require('body-parser');
app.use(express.json());
const port = 3000;

require("dotenv").config();

// Define your API key
const apiKey = process.env.API_KEY || "bUMx6Ir4dWch"; // Puedes definir la API key en el archivo .env

// Crea una función de middleware para verificar la API key
function verifyApiKey(req, res, next) {
  const providedApiKey = req.headers["api-key"];

  if (providedApiKey && providedApiKey === apiKey) {
    // La API key es válida
    next();
  } else {
    // La API key no es válida
    res.status(403).json({ error: "Acceso no autorizado. API key inválida." });
  }
}// Use the middleware for all routes

const pool = new Pool({
  user: "default",
  host: "ep-polished-glitter-00374982-pooler.us-east-1.postgres.vercel-storage.com",
  database: "verceldb",
  password: "bUMx6Ir4dWch",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// create user and generate text file
app.post('/users/upload', async (req, res) => {
  try {
    const data = req.body;

    // Lógica para guardar datos en la base de datos (ejemplo con PostgreSQL)
    const insertQuery = `
      INSERT INTO users(document_number, full_name, profession, studies, experience, cv)
      VALUES($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.document_number,
      data.full_name,
      data.profession,
      data.studies,
      data.experience,
      data.cv,
    ];

    const result = await pool.query(insertQuery, values);

    console.log('Datos guardados en la base de datos:', result.rows[0]);

    // Crear el contenido del archivo de texto con los datos ingresados
    const content = Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    // Definir la ruta del directorio de uploads
    const uploadDir = path.join(__dirname, 'uploads');

    // Verificar si el directorio existe, si no, crearlo
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (mkdirErr) {
      console.error('Error al crear el directorio:', mkdirErr);
      res.status(500).send('Error interno del servidor.');
      return;
    }

    // Guardar el contenido en un archivo llamado 'upload.txt' dentro del directorio de uploads
    const filePath = path.join(uploadDir, 'Cv.txt');
    await fs.writeFile(filePath, content);

    console.log(`Archivo ${filePath} generado con éxito.`);

    res.status(200).send('Datos guardados en la base de datos y archivo generado con éxito.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error interno del servidor.');
  }
});
/**
 * @swagger
 * /users/upload:
 *   post:
 *     summary: Create a new user and generate a text file with the provided data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               document_number:
 *                 type: string
 *               full_name:
 *                 type: string
 *               profession:
 *                 type: string
 *               studies:
 *                 type: string
 *               experience:
 *                 type: string
 *     responses:
 *       200:
 *         description: File generated successfully.
 *       500:
 *         description: Internal Server Error.
 */

// Obtener un usuario por document_number
app.get("/users/:document_number", async (req, res) => {
  // Construir la consulta para obtener un usuario por document_number
  const getUserQuery = `SELECT * FROM users WHERE document_number = ${req.params.document_number}`;

  try {
    // Ejecutar la consulta para obtener el usuario
    const data = await pool.query(getUserQuery);

    // Mostrar información en la consola
    console.log("User details: ", data.rows);

    // Enviar la respuesta con los detalles del usuario
    res.status(200).send(data.rows);
  } catch (err) {
    console.error(err);
    // Enviar respuesta de error en caso de problemas
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{document_number}:
 *   get:
 *     summary: Get details of a user by document_number.
 *     parameters:
 *       - in: path
 *         name: document_number
 *         schema:
 *           type: string
 *         required: true
 *         description: Document number of the user.
 *     responses:
 *       200:
 *         description: Details of the user.
 *       500:
 *         description: Internal Server Error.
 */

// Agregar un nuevo usuario
app.post("/users", function (req, res) {
  const document_number = req.body.document_number;
  const full_name = req.body.full_name;
  const profession = req.body.profession;
  const studies = req.body.studies;
  const experience = req.body.experience; // Agregado el campo 'experience'
  const insertar = `INSERT INTO users(document_number, full_name, profession, studies, experience) 
  VALUES(${document_number}, '${full_name}', '${profession}', '${studies}', '${experience}')`;

  pool.query(insertar)
    .then(() => {
      res.status(201).send("User saved");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
  console.log(req.body);
});

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Add a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               document_number:
 *                 type: string
 *               full_name:
 *                 type: string
 *               profession:
 *                 type: string
 *               studies:
 *                 type: string
 *               experience:
 *                 type: string
 *     responses:
 *       201:
 *         description: User saved.
 *       500:
 *         description: Internal Server Error.
 */

// Actualizar un usuario por id
app.put("/users/:id", async (req, res) => {
  // Campos permitidos para actualizar
  const allowedFields = ['profession', 'studies', 'experience', 'cv'];

  // Filtrar los campos enviados en la solicitud para asegurarse de que solo se actualicen los permitidos
  const updateFields = Object.keys(req.body).filter(field => allowedFields.includes(field));

  // Verificar si hay campos para actualizar
  if (updateFields.length === 0) {
    return res.status(400).json({ error: "Bad Request: No valid fields to update." });
  }

  // Construir la consulta de actualización dinámicamente
  const updateQuery = `UPDATE users SET ${updateFields.map(field => `${field}='${req.body[field]}'`).join(', ')} WHERE id=${req.params.id}`;

  try {
    // Ejecutar la consulta de actualización
    pool.query(updateQuery);

    // Enviar respuesta exitosa
    res.status(201).send("User modified successfully.");
  } catch (err) {
    console.error(err);
    // Enviar respuesta de error en caso de problemas
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user details by id.
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profession:
 *                 type: string
 *               studies:
 *                 type: string
 *               experience:
 *                 type: string
 *               cv:
 *                 type: string
 *     responses:
 *       201:
 *         description: User modified successfully.
 *       400:
 *         description: 'Bad Request: No valid fields to update.'
 *       500:
 *         description: Internal Server Error.
 */

// Eliminar un usuario por document_number
app.delete("/users/:document_number", async (req, res) => {
    // Construir la consulta de eliminación basada en el document_number proporcionado
    const deleteQuery = `DELETE FROM users WHERE document_number=${req.params.document_number}`;
  
    try {
      // Ejecutar la consulta de eliminación
      await pool.query(deleteQuery);
  
      // Enviar respuesta exitosa
      res.status(204).send("User Deleted");
    } catch (err) {
      console.error(err);
      // Enviar respuesta de error en caso de problemas
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  /**
 * @swagger
 * paths:
 *   /users/{document_number}:
 *     delete:
 *       summary: Elimina un usuario por número de documento
 *       parameters:
 *         - in: path
 *           name: document_number
 *           required: true
 *           description: Número de documento del usuario a eliminar
 *           schema:
 *             type: string
 *       responses:
 *         204:
 *           description: Usuario eliminado exitosamente
 *         500:
 *           description: Error interno del servidor
 */

app.get("/users", async (req, res) => {
    // Construir la consulta para obtener todos los usuarios
    const getAllUsersQuery = "SELECT * FROM users";
  
    try {
      // Ejecutar la consulta para obtener todos los usuarios
      const data = await pool.query(getAllUsersQuery);
  
      // Mostrar información en la consola
      console.log("All users: ", data.rows);
  
      // Enviar la respuesta con todos los usuarios
      res.status(200).send(data.rows);
    } catch (err) {
      console.error(err);
      // Enviar respuesta de error en caso de problemas
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

 /**
 * @swagger
 * /users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Endpoint para obtener la lista completa de usuarios.
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida con éxito.
 *         content:
 *           application/json:
 *             example:
 *              - document_number: 876543210
 *              - full_name: Gabriela Rodríguez
 *              - profession: Arquitecta de Software
 *              - studies: Ingeniería en Computación
 *              - experience: Líder de Desarrollo
 *              - cv: null  
 *
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               error: Internal Server Error
 */
  
module.exports = app;

app.listen(port, function () {
  console.log(`the student server is working`);
  v1SwaggerDocs(app, port);
});