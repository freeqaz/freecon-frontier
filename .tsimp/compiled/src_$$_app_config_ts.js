import config from "@colyseus/tools";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { parse } from 'url';
import next from 'next';
/**
 * Import your Room files
 */
import { MyRoom } from "./colyseus/rooms/MyRoom.js";
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 2567;
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
                }
                else if (pathname === '/game') {
                    await app.render(req, res, '/game', query);
                }
                else {
                    await handle(req, res, parsedUrl);
                }
            }
            catch (err) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmNvbmZpZy5qcyIsInNvdXJjZVJvb3QiOiIvVXNlcnMvZnJlZS9jb2RlL2ZyZWVjb24tZnJvbnRpZXIvZnJlZWNvbi1mcm9udGllci1mcm9udGVuZC8iLCJzb3VyY2VzIjpbInNyYy9hcHAuY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sTUFBTSxNQUFNLGlCQUFpQixDQUFDO0FBQ3JDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFFbEQsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEtBQUssQ0FBQztBQUM1QixPQUFPLElBQUksTUFBTSxNQUFNLENBQUM7QUFFeEI7O0dBRUc7QUFDSCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFcEQsTUFBTSxHQUFHLEdBQVksT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEtBQUssWUFBWSxDQUFDO0FBQzNELE1BQU0sUUFBUSxHQUFXLFdBQVcsQ0FBQztBQUNyQyxNQUFNLElBQUksR0FBVyxJQUFJLENBQUM7QUFDMUIsYUFBYTtBQUNiLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUMxQyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztBQUV2QyxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDO0lBRWxDLGFBQWE7SUFDVCxvQkFBb0IsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFO1FBQ2pDOztXQUVHO1FBQ0gsVUFBVSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFFekMsQ0FBQztJQUVMLGFBQWE7SUFDVCxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUU7UUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1FBQ3BDLE1BQU0sR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXBCOzs7V0FHRztRQUNYLGFBQWE7UUFDTCxVQUFVLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRTtZQUN4QyxHQUFHLENBQUMsSUFBSSxDQUFDLDJDQUEyQyxDQUFDLENBQUM7UUFDMUQsQ0FBQyxDQUFDLENBQUM7UUFFSDs7O1dBR0c7UUFDSCxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLFlBQVksRUFBRSxDQUFDO1lBQ3hDLFVBQVUsQ0FBQyxHQUFHLENBQUMsc0JBQXNCLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUVEOzs7O1dBSUc7UUFDSCxVQUFVLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRS9DLGFBQWE7UUFDTCxVQUFVLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFDOUIsSUFBSSxDQUFDO2dCQUNELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDN0MsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxTQUFTLENBQUM7Z0JBRXRDLElBQUksUUFBUSxLQUFLLEdBQUcsRUFBRSxDQUFDO29CQUNuQixNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7Z0JBQzNDLENBQUM7cUJBQU0sSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7b0JBQzlCLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDL0MsQ0FBQztxQkFBTSxDQUFDO29CQUNKLE1BQU0sTUFBTSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7WUFDTCxDQUFDO1lBQUMsT0FBTyxHQUFRLEVBQUUsQ0FBQztnQkFDaEIsT0FBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUN2RCxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztnQkFDckIsR0FBRyxDQUFDLEdBQUcsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3JDLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFHRCxZQUFZLEVBQUUsR0FBRyxFQUFFO1FBQ2Y7O1dBRUc7SUFDUCxDQUFDO0NBQ0osQ0FBQyxDQUFDIn0=