import {ConfigOptions, default as colyseusTools} from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { parse } from 'url';
import { matchMaker } from "@colyseus/core";

matchMaker.controller.getCorsHeaders = function(req) {
    return {
        'Access-Control-Allow-Origin': '*',
        'Vary': '*',
        // 'Vary': "<header-name>, <header-name>, ...",
    }
}

/**
 * Import your Room files
 */
import { MyRoom } from "./colyseus/rooms/MyRoom.js";

// I have no idea why this madness happens at the type level but this tames the beast.
export default ((colyseusTools as unknown) as (options: ConfigOptions) => ConfigOptions)({
    options: {
        devMode: true,
    },

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('my_room', MyRoom);

    },

    initializeExpress: async (expressApp) => {

        /**
         * Bind your custom express routes here:
         * Read more: https://expressjs.com/en/starter/basic-routing.html
         */
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
   },

    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});