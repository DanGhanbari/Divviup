const socketIo = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = socketIo(httpServer, {
            cors: {
                origin: [
                    'https://divviup.vercel.app',
                    'https://divviup.xyz',
                    'https://www.divviup.xyz',
                    'http://localhost:5173',
                    'http://localhost:5001'
                ],
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        io.on('connection', (socket) => {
            console.log('New client connected:', socket.id);

            socket.on('join_group', (groupId) => {
                socket.join('group_' + groupId);
                console.log(`Socket ${socket.id} joined group_${groupId}`);
            });

            socket.on('leave_group', (groupId) => {
                socket.leave('group_' + groupId);
                console.log(`Socket ${socket.id} left group_${groupId}`);
            });

            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });

        return io;
    },
    getIo: () => {
        if (!io) {
            throw new Error('Socket.io not initialized!');
        }
        return io;
    }
};
