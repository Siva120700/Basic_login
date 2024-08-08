const express = require('express')
const {Client} = require('pg')
const bcrypt = require('bcrypt')
const router = express.Router();
const cors = require('cors');

const app = express();
app.use(express.json({limit:'1mb'}))
const port = 8800;

const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'department_details',
    password: 'Siva#1207',
    port: 5433,
})
client.connect()
.then(() => console.log("Connected to PostgreSQL database user"))
.catch(err =>console.error("error",err.stack))

app.use(cors({
    origin:['http://localhost:4200']
}))

app.post('/api/auth/signup',async (req,res)=>{
    const {name,email,password,age,phone,doj,salary,department_id}= req.body;

    if(!name || !email || !password || !age || !salary){
        return res.status(400).send("Missing essential data");
    }

    const hashedpassword= await bcrypt.hash(password,10);
    const query= 'INSERT INTO employees(name,email,password,age,phone,doj,salary,department_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *';
    // const query= `INSERT INTO employees(name,email,age,phone,doj,salary,department_id) VALUES ('siva','abc@email.com' , 30, '0123456789', '2024/07/12', 25000, 1) RETURNING *`;

    const VALUES =[name, email, hashedpassword, age, phone, doj, salary, department_id];

    try{
        let result = await client.query(query,VALUES);
        console.log(result);
        // res.status(201).send("User registered successfully");
        res.json({message: 'registered sucessfully'})
    }
    catch(err){
        console.error("Error registering user",err.message);
        res.status(500).send("User registered successfully");
    }

});

app.get('/api/employees', async (req, res) => {
    try {
      const result = await client.query('SELECT * FROM employees');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
  
    if (!email || !password) {
      return res.status(400).send("Missing email or password");
    }
  
    try {
      const query = 'SELECT * FROM employees WHERE email = $1';
      const result = await client.query(query, [email]);
  
      if (result.rows.length === 0) {
        return res.status(401).send("Invalid email or password");
      }
  
      const user = result.rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).send("Invalid email or password");
      }
  
      res.status(200).json({ message: 'Login successful', user });
    } catch (err) {
      console.error("Error logging in:", err.message);
      res.status(500).send("Server error");
    }
  });
  app.put('/api/employees/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, salary } = req.body;

    if (!name || !email || !phone || !salary) {
        return res.status(400).send("Missing essential data");
    }

    const query = `
        UPDATE employees
        SET name = $1, email = $2, phone = $3, salary = $4
        WHERE employee_id = $5 RETURNING *;
    `;
    const values = [name, email, phone, salary, id];

    try {
        const result = await client.query(query, values);
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error updating employee", err.message);
        res.status(500).send("Error updating employee");
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});