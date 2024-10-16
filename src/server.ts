import express from "express";
import {Request, Response, Router} from "express";
import { AccountsHandler } from "./accounts/accounts";

const port = 3000; 
const server = express();
const routes = Router();

routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 403;
    res.send('Acesso não permitido.');
});

routes.put('/signUp', AccountsHandler.createAccountRoute);
routes.post('/login', AccountsHandler.loginRoute);
routes.put('/addEvent', AccountsHandler.addEventRoute);
routes.get('/getEvents', AccountsHandler.getEventsRoute);
routes.delete('/deleteEvent', AccountsHandler.deleteEventsRoute);

server.use(routes);

server.listen(port, ()=>{
    console.log(`Server is running on: ${port}`);
})