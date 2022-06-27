import express from "express";
const port = 3000;
const app = express();
const root = new URL(import.meta.url)
console.log(`Iniciando servidor... en ${root}`);


app.use(express.static(new URL('public', root).pathname));
app.use(function (req, res, next) {
    res.status(404).send(`Sorry can't find ${req.path}`);
});

app.get('/', (req, res) => {
    res.sendFile(new URL('index.html', root).pathname);
    console.log(URL);
});

app.listen(port, () => {
    console.log(`Servidor listo en el puerto ${port}`);
});


