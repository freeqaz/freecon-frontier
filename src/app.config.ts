import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';

/**
 * Import your Room files
 */
import { MyRoom } from "./colyseus/rooms/MyRoom.js";

const dev: boolean = process.env.NODE_ENV !== 'production';
const hostname: string = 'localhost';
const port: number = 2567;
// @ts-ignore
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

export const colyseusApp = config({

// @ts-ignore
    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom);

    },

// @ts-ignore
    initializeExpress: async (expressApp) => {
        console.log('starting next server');
        await app.prepare();

        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
// @ts-ignore
        expressApp.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            expressApp.use("/colyseus/playground", playground);
        }

        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitor/#restrict-access-to-the-panel-using-a-password
         */
        expressApp.use("/colyseus", monitor());

// @ts-ignore
        expressApp.use(async (req, res) => {
            try {
                const parsedUrl = parse(req.url || '', true);
                const { pathname, query } = parsedUrl;

                if (pathname === '/') {
                    await app.render(req, res, '/', query);
                } else if (pathname === '/game') {
                    await app.render(req, res, '/game', query);
                } else {
                    await handle(req, res, parsedUrl);
                }
            } catch (err: any) {
                console.error('Error occurred handling', req.url, err);
                res.statusCode = 500;
                res.end('internal server error');
            }
        });
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});
