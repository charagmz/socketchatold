const { io } = require('../server');
const { Usuarios } = require('../classes/usuarios');
const {crearMensaje}  = require('../helpers/utilidades');

const usuarios = new Usuarios();

io.on('connection', (client) => {

    client.on('entrar-chat', (data, callback) => {
        if (!data.nombre || !data.sala) {
            return callback({
                error: true,
                mensaje: 'El nombre/sala es necesario'
            });
        }

        client.join(data.sala);

        usuarios.agregarPersona(client.id, data.nombre, data.sala);
        const personas = usuarios.getPersonasPorSala(data.sala);
        //console.log(data);
        client.broadcast.to(data.sala).emit('lista-personas', usuarios.getPersonasPorSala(data.sala));
        client.broadcast.to(data.sala).emit('crear-mensaje', crearMensaje('Administrador', `${data.nombre} se unio`));


        return callback(personas);
    });

    client.on('crear-mensaje', (data, callback) => {
        const persona = usuarios.getPersona(client.id);
        const mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(persona.sala).emit('crear-mensaje', mensaje);
        callback(mensaje);
    });

    client.on('disconnect', () => {
        const personaBorrada = usuarios.borrarPersona(client.id);
        const mensaje = crearMensaje('Administrador', `${personaBorrada.nombre} abandono el chat`);
        client.broadcast.to(personaBorrada.sala).emit('crear-mensaje', mensaje);
        client.broadcast.to(personaBorrada.sala).emit('lista-personas', usuarios.getPersonasPorSala(personaBorrada.sala));
        //console.log(personaBorrada);
    });

    // Mensajes privados
    client.on('mensaje-privado', data => {
        const persona = usuarios.getPersona(client.id);
        const mensaje = crearMensaje(persona.nombre, data.mensaje);
        client.broadcast.to(data.para).emit('mensaje-privado', mensaje);
    });

});