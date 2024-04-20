const express = require("express");
const multer = require("multer");
const fs = require("node:fs");
const app = express();
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
// const swaggerDocument = require("./swagger.json");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Device API",
      version: "1.0.0",
      description: "API для системи інвертизації пристроїв",
    },
    servers: [
      {
        url: "http://localhost:8000",
      },
    ],
  },
  apis: ["./main.js"],
};

const specs = swaggerJsDoc(options);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folderPath = "images";
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath);
    }
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });

devices = [];

const upload = multer({ storage: storage });

app.use(express.static("static"));

function checkdevice() {
  if (!fs.existsSync("device.json")) {
    fs.writeFileSync("device.json", "[]");
  }
}

function checkuser() {
  if (!fs.existsSync("user.json")) {
    fs.writeFileSync("user.json", "[]");
  }
}

/**
 * @swagger
 * tags:
 *   - name: Пристрої
 *     description: Дії над пристроями
 *   - name: Користувачі
 *     description: Дії над користувачами
 *   - name: Взаємодія користувачів з пристроями
 */
app.post("/device", express.json(), (req, res) => {
  checkdevice();

  const data = fs.readFileSync("device.json", "utf-8");
  const getdevices = JSON.parse(data);

  const newdevice = req.body;
  const { IDs, name, description, serial_number, manufacturer } = newdevice;

  const existingItem = getdevices.find((device) => device.IDs === IDs);

  if (!existingItem) {
    getdevices.push({
      IDs,
      name,
      description,
      serial_number,
      manufacturer,
      image_path: "None",
      owner: "None",
    });

    const dataJSON = JSON.stringify(getdevices);
    fs.writeFileSync("device.json", dataJSON);

    res.status(201).json({ success: "Пристрій успішно зареєстровано" }).end();
  } else {
    res
      .status(400)
      .json({ error: "Пристрій з таким ID вже зареєстрований" })
      .end();
  }
});

/**
 * @swagger
 * /device:
 *    post:
 *      tags:
 *        - Пристрої
 *      summary: Зареєструвати пристрій
 *      requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               IDs:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                  type: string
 *               serial_number:
 *                  type: string
 *               manufacturer:
 *                  type: string
 *      responses:
 *        201:
 *           description: Пристрій успішно зареєстровано
 *        400:
 *            description: Пристрій з таким ID вже зареєстрований
 *
 */

app.get("/devices", (req, res) => {
  checkdevice();
  const data = fs.readFileSync("device.json", "utf-8");

  res.status(200).send(data);
});

/**
 * @swagger
 * /devices:
 *    get:
 *      tags:
 *        - Пристрої
 *      summary: Отримати список та інформацію про наявні пристрої
 *      responses:
 *        200:
 *           description: Запит виконано успішно
 */

app.get("/device/:ID", (req, res) => {
  checkdevice();
  const data = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data);
  const ID = req.params.ID;

  const existingItem = devices.find((device) => device.IDs === ID);
  if (existingItem) {
    result = JSON.stringify(existingItem);

    res.status(200).send(result);
  } else {
    res.status(404).json({ error: "Пристрій з таким ID не знайдений" });
  }
});

/**
 * @swagger
 * /device/{ID}:
 *   get:
 *     tags:
 *        - Пристрої
 *     summary: Отримати інформацію про конкретний пристрій за його ідентифікатором
 *     parameters:
 *       - in: path
 *         name: ID
 *         required: true
 *         schema:
 *           type: string
 *         description: Ідентифікатор пристрою
 *     responses:
 *       200:
 *         description: Інформацію про пристрій успішно отримано
 *       404:
 *         description: Пристрій з таким ідентифікатором не знайдено
 */

app.delete("/device/:ID", (req, res) => {
  checkdevice();
  const data = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data);
  const ID = req.params.ID;

  const index = devices.findIndex((device) => device.IDs === ID);

  if (index !== -1) {
    devices.splice(index, 1);

    result = JSON.stringify(devices);
    fs.writeFileSync("device.json", result);

    res.status(200).json({ success: "Пристрій успішно видалений" });
  } else {
    res.status(404).json({ error: "Пристрій не знайдено" });
  }
});

/**
 * @swagger
 * /device/{ID}:
 *   delete:
 *     tags:
 *        - Пристрої
 *     summary: Видалити конкретний пристрій за його ідентифікатором
 *     parameters:
 *       - in: path
 *         name: ID
 *         required: true
 *         schema:
 *           type: string
 *         description: Ідентифікатор пристрою
 *     responses:
 *       200:
 *         description: Пристрій успішно видалено
 *       404:
 *         description: Пристрій з таким ідентифікатором не знайдено
 */

app.put("/device", express.json(), (req, res) => {
  checkdevice();
  const data = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data);
  const { name, description, serial_number, manufacturer } = req.body;
  const IDdevice = req.body;
  const { IDs } = IDdevice;

  const index = devices.findIndex((device) => device.IDs === IDs);

  if (index !== -1) {
    devices[index].name = name;
    devices[index].description = description;
    devices[index].serial_number = serial_number;
    devices[index].manufacturer = manufacturer;

    result = JSON.stringify(devices);
    fs.writeFileSync("device.json", result);

    res
      .status(200)
      .json({ success: "Інформація про пристрій успішно оновлена" });
  } else {
    res.status(404).json({ error: "Пристрій не знайдено" });
  }
});

/**
 * @swagger
 * /device:
 *    put:
 *      tags:
 *        - Пристрої
 *      summary: Оновити інформацію конкретного пристрою
 *      requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               IDs:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                  type: string
 *               serial_number:
 *                  type: string
 *               manufacturer:
 *                  type: string
 *      responses:
 *        200:
 *           description: Інформація про пристрій успішно оновлена
 *        404:
 *            description: Пристрій з таким ID не знайдено
 *
 */

app.put("/device/:ID/image", upload.single("image"), (req, res) => {
  checkdevice();
  const data = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data);

  const deviceImage = req.file.path;
  const IDdevice = req.params.ID;

  const index = devices.findIndex((device) => device.IDs === IDdevice);

  if (index !== -1) {
    devices[index].image_path = deviceImage;

    result = JSON.stringify(devices);
    fs.writeFileSync("device.json", result);

    res.status(200).json({ success: "Зображення пристрою збережено" });
  } else {
    res.status(404).json({ error: "Пристрій не знайдено" });
  }
});

/**
 * @swagger
 * /device/{ID}/image:
 *   put:
 *     tags:
 *        - Пристрої
 *     summary: Додати фотографію пристрою
 *     parameters:
 *       - in: path
 *         name: ID
 *         required: true
 *         schema:
 *           type: string
 *         description: Ідентифікатор пристрою
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: file
 *                 format: path
 *     responses:
 *       200:
 *         description: Зображення пристрою збережено
 *       404:
 *         description: Пристрій не знайдено
 *
 */
app.get("/device/:ID/image", express.json(), (req, res) => {
  checkdevice();
  const data = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data);

  const ID = req.params.ID;

  const index = devices.findIndex((device) => device.IDs === ID);

  if (index !== -1) {
    locationImage = devices[index].image_path;

    const absolutePath = path.join(__dirname, locationImage);

    res.status(200).sendFile(absolutePath);
  } else {
    res.status(404).json({ error: "Зображення не знайдено" });
  }
});

/**
 * @swagger
 * /device/{ID}/image:
 *   get:
 *     tags:
 *        - Пристрої
 *     summary: Відкрити фотографію пристрою
 *     parameters:
 *       - in: path
 *         name: ID
 *         required: true
 *         schema:
 *           type: string
 *         description: Ідентифікатор пристрою
 *     responses:
 *       200:
 *         description: Зображення відкрито успішно
 *       404:
 *         description: Зображення не знайдено
 *
 */

app.post("/user", express.json(), (req, res) => {
  checkuser();
  const data = fs.readFileSync("user.json", "utf-8");
  const users = JSON.parse(data);

  const newuser = req.body;
  const { name, password } = newuser;

  const existingUser = users.find((user) => user.name === name);

  if (!existingUser) {
    users.push({
      name,
      password,
    });

    const dataJSON = JSON.stringify(users);
    fs.writeFileSync("user.json", dataJSON);

    res
      .status(201)
      .json({ success: "Користувача успішно зареєстровано" })
      .end();
  } else {
    res.status(400).json({ error: "Користувач з таким ім'ям вже існує" }).end();
  }
});

/**
 * @swagger
 * /user:
 *    post:
 *      tags:
 *        - Користувачі
 *      summary: Зареєструвати користувача
 *      requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               password:
 *                  type: string
 *      responses:
 *        201:
 *           description: Користувач успішно зареєстровано
 *        400:
 *            description: Користувач з таким ім'ям вже існує
 *
 */

app.put("/user/owner", express.json(), (req, res) => {
  const data = fs.readFileSync("user.json", "utf-8");
  const users = JSON.parse(data);

  const reqdata = req.body;
  const { name, password, IDs } = reqdata;

  const existingUser = users.find(
    (user) => user.name === name && user.password === password
  );

  if (existingUser) {
    const data1 = fs.readFileSync("device.json", "utf-8");
    const devices = JSON.parse(data1);

    const index = devices.findIndex((device) => device.IDs === IDs);

    if (index !== -1) {
      if (devices[index].owner !== "None") {
        res.status(400).json({ error: "Пристрій перебуває у користуванні" });
      } else {
        devices[index].owner = name;

        result = JSON.stringify(devices);
        fs.writeFileSync("device.json", result);

        res
          .status(200)
          .json({ succes: "Пристрій успішно взято у користування" });
      }
    } else {
      res.status(404).json({ error: "Пристрій не знайдено" });
    }
  } else {
    res.status(401).json({ error: "Користатувач не зареєстрований" });
  }
});

/**
 * @swagger
 * /user/owner:
 *    put:
 *      tags:
 *        - Взаємодія користувачів з пристроями
 *      summary: Взяття у користування пристрою
 *      requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               IDs:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                  type: string
 *      responses:
 *        200:
 *           description: Пристрій успішно взято у користування
 *        404:
 *            description: Пристрій не знайдено
 *        401:
 *           description: Користувач не зареєстрований
 *
 */

app.put("/user/owner/back", express.json(), (req, res) => {
  const data = fs.readFileSync("user.json", "utf-8");
  const users = JSON.parse(data);

  const reqdata = req.body;
  const { name, password, IDs } = reqdata;

  const existingUser = users.find(
    (user) => user.name === name && user.password === password
  );

  if (!existingUser) {
    res.status(401).json({ error: "Користатувач не зареєстрований" });
  }

  const data1 = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data1);

  const index = devices.findIndex((device) => device.IDs === IDs);

  if (index !== -1) {
    if (devices[index].owner !== name) {
      res.status(403).send({ error: "Пристрій не у Вашому користуванні" });
    }

    devices[index].owner = "None";

    result = JSON.stringify(devices);
    fs.writeFileSync("device.json", result);

    res.status(200).json({ success: "Пристрій успішно повернено" });
  } else {
    res.status(404).json({ error: "Пристрій не знайдено" });
  }
});

/**
 * @swagger
 * /user/owner/back:
 *   put:
 *     tags:
 *        - Взаємодія користувачів з пристроями
 *     summary: Повернення пристрою користувачем
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               IDs:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Пристрій успішно повернено
 *       404:
 *         description: Пристрій не знайдено
 *       401:
 *         description: Користувач не зареєстрований
 *       403:
 *         description: Пристрій вже зайнятий
 */

app.get("/user/owner", express.json(), (req, res) => {
  const data = fs.readFileSync("user.json", "utf-8");
  const users = JSON.parse(data);

  const data1 = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data1);

  // const reqdata = req.body;
  // const { name, password } = reqdata;

  const name = req.query.name;
  const password = req.query.password;

  const existingUser = users.find(
    (user) => user.name === name && user.password === password
  );

  if (!existingUser) {
    res.status(401).json({ error: "Користатувач не зареєстрований" });
  }

  const list_users_items = devices.filter((device) => device.owner === name);

  const result = JSON.stringify(list_users_items);

  if (result) {
    res.status(200).send(result);
  } else {
    res
      .status(404)
      .json({ error: "Пристроїв у власності користувача не знайдено" });
  }
});

/**
 * @swagger
 * /user/owner:
 *   get:
 *     tags:
 *        - Взаємодія користувачів з пристроями
 *     summary: Отримання списку пристроїв, якими володіє користувач
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: password
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Список успішно отримано
 *       404:
 *         description: Пристроїв у власності користувача не знайдено
 *       401:
 *         description: Користувач не зареєстрований
 */

app.get("/devices/owner", express.json(), (req, res) => {
  const data = fs.readFileSync("user.json", "utf-8");

  const data1 = fs.readFileSync("device.json", "utf-8");
  const devices = JSON.parse(data1);

  const list_users_items = devices.filter((device) => device.owner !== "None");

  const result = JSON.stringify(list_users_items);

  if (result !== "[]") {
    res.status(200).send(result);
  } else {
    res.status(404).json({ error: "Пристроїв у власності не знайдено" });
  }
});

/**
 * @swagger
 * /devices/owner:
 *    get:
 *      tags:
 *        - Взаємодія користувачів з пристроями
 *      summary: Отримати список та інформацію про пристрої, які перебувають у користуванні
 *      responses:
 *        200:
 *           description: Запит виконано успішно
 *        404:
 *           description: Пристроїв у власності не знайдено
 */

app.listen(8000, () => {
  console.log("Server is running");
});
