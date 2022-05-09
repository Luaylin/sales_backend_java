require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser');
var cors = require('cors')
const app = express()
const port = process.env.PORT
var morgan = require('morgan')
const db = require('./database')
const moment = require('moment')

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors())
app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.send('API of System!')
})

app.post('/login', async (req, res) => {
    if(req.body.user && req.body.pass){
        let response = await db.queryWithParams('SELECT * FROM trabajador WHERE usuario = ? AND clave = ?', [req.body.user, req.body.pass])
        if(response.length>0){
            res.redirect(process.env.FRONTEND+"/Principal.jsp");
        } else {
            res.redirect(process.env.FRONTEND)
        }
    } else {
        res.redirect(process.env.FRONTEND)
    }
});

app.post('/getTrabajadores', async (req, res) => {
    let response = await db.query('SELECT * FROM trabajador');
    res.send({data:response});
});

app.post('/deleteTrabajadores', async (req,res)=>{
    let response = await db.remove('DELETE FROM trabajador WHERE dni = ?', [req.body.id]);
    res.redirect(process.env.FRONTEND+'/registroEmpleados.jsp')
})

app.post('/getClientes', async (req, res) => {
    let response = await db.query('SELECT * FROM cliente');
    res.send({data:response});
});

app.post('/deleteCliente', async (req,res)=>{
    let response = await db.remove('DELETE FROM cliente WHERE dni_cli = ?', [req.body.id]);
    res.redirect(process.env.FRONTEND+'/registroClientes.jsp')
})

app.post('/getProductos', async (req, res) => {
    let response = await db.query('SELECT * FROM producto');
    res.send({data:response});
});

app.post('/deleteProducto', async (req,res)=>{
    let response = await db.remove('DELETE FROM producto WHERE idproducto = ?', [req.body.id]);
    res.redirect(process.env.FRONTEND+'/IngresoProductos.jsp')
})

app.post('/createEmployee',async(req,res)=>{
    if(req.body.dni && req.body.nombres && req.body.apellidos && req.body.direccion && req.body.edad && req.body.nro_celular && req.body.cargo && req.body.usuario && req.body.clave){
        await db.insert('INSERT INTO trabajador VALUES (?,?,?,?,?,?,?,?,?)',[req.body.dni, req.body.nombres, req.body.apellidos, req.body.direccion, req.body.edad, req.body.nro_celular, req.body.cargo, req.body.usuario, req.body.clave]);
    } else {
        console.log("Error to create employee")
    }
    res.redirect(process.env.FRONTEND+"/registroEmpleados.jsp");
});

app.post('/createClients',async(req,res)=>{
    if(req.body.dni && req.body.nombres && req.body.apellidos && req.body.sexo && req.body.telefono && req.body.email && req.body.direccion){
        await db.insert('INSERT INTO cliente VALUES (?,?,?,?,?,?,?)',[req.body.dni, req.body.nombres, req.body.apellidos, req.body.sexo, req.body.telefono, req.body.email, req.body.direccion]);
    } else {
        console.log("Error to create clients")
    }
    res.redirect(process.env.FRONTEND+"/registroClientes.jsp");
});

app.post('/createProducts',async(req,res)=>{
    if(req.body.codigo && req.body.tipoproducto && req.body.marca && req.body.nombre && req.body.descripcion && req.body.precio && req.body.stock){
        await db.insert('INSERT INTO producto VALUES (?,?,?,?,?,?,?)',[req.body.codigo, req.body.tipoproducto, req.body.marca, req.body.nombre, req.body.descripcion, req.body.precio, req.body.stock]);
    } else {
        console.log("Error to create products")
    }
    res.redirect(process.env.FRONTEND+"/IngresoProductos.jsp");
});

app.post('/eliminarVenta', async(req,res)=>{
    let response = await db.remove('DELETE FROM ventas WHERE id = ?', [req.body.id]);
    res.redirect(process.env.FRONTEND+"/ventas.jsp");
})

app.post('/getVenta/:id', async (req, res) => {
    let response = await db.queryWithParams("SELECT CONCAT(c.nom_cli,' ',c.ape_cli) as cliente, CONCAT(t.nombre, ' ', t.apellidos) as trabajador, v.total FROM ventas as v INNER JOIN cliente as c ON v.cliente = c.dni_cli INNER JOIN trabajador as t ON v.trabajador = t.dni WHERE v.id =?", [req.params.id]);
    res.send(response[0]);
});

app.post('/getVentas', async (req, res) => {
    let response = await db.query("SELECT v.id, CONCAT(c.nom_cli,' ',c.ape_cli) as cliente, CONCAT(t.nombre,' ',t.apellidos) as trabajador, v.total, v.fecha FROM ventas as v INNER JOIN cliente as c ON v.cliente = c.dni_cli INNER JOIN trabajador as t ON v.trabajador = t.dni;");
    response = response.map(x=>{
        x.fecha = moment(x.fecha).format('DD-MM-YYYY HH:mm:ss');
        return x
    })
    res.send({data:response});
});

app.post('/getDetallesVenta/:id', async (req, res) => {
    let response = await db.queryWithParams("SELECT detalle_producto, cantidad_producto, precio_unitario FROM detalles_ventas WHERE id_venta =?", [req.params.id]);
    res.send({data: response});
});

app.post('/crearVenta', async(req,res)=>{
    console.log(req.body)
    //1. Obtener los datos de la venta
    let idsProductos, descProductos, cantProductos, precioProductos
    if(Array.isArray(req.body["pid[]"])){
        idsProductos = req.body["pid[]"];
        descProductos = req.body["pdescription[]"];
        cantProductos = req.body["quantities[]"];
        precioProductos = req.body["prices[]"];
    } else {
        idsProductos = [req.body["pid[]"]];
        descProductos = [req.body["pdescription[]"]];
        cantProductos = [req.body["quantities[]"]];
        precioProductos = [req.body["prices[]"]];
    }
    //2. Calcular el total de la venta
    let total = 0;
    for(let i = 0; i < idsProductos.length; i++){
        total += cantProductos[i] * precioProductos[i];
    }
    //3. Registrar los datos de la venta en la db
    let response = await db.insert('INSERT INTO ventas (cliente, trabajador, total) VALUES (?,?,?)',[req.body.client, req.body.trabajador, total]);

    //4. Registrar los detalles
    let status = true;
    if(response.status){
        let id = response.id;
        for(let i = 0; i < idsProductos.length; i++){
            response = await db.insert('INSERT INTO detalles_ventas VALUES (?,?,?,?,?)',[id, idsProductos[i], descProductos[i], cantProductos[i], precioProductos[i]]);
            if(!response.status){
                status = false;
                break;
            }
        }
        if(status){
            //5. Actualizar el stock de los productos
            for(let i = 0; i < idsProductos.length; i++){
                response = await db.queryWithParams('SELECT stock FROM producto WHERE idproducto = ?',[idsProductos[i]]);
                let stock = response[0].stock;
                stock -= cantProductos[i];
                response = await db.update('UPDATE producto SET stock = ? WHERE idproducto = ?',[stock, idsProductos[i]]);
            }
        }
    }
    res.redirect(process.env.FRONTEND+"/ventas.jsp");
})

app.listen(port, () => {
    console.log(`System API listening on port ${port}`)
})