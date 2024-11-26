import express from "express";
import {Request, Response, Router} from "express";
import { AccountsHandler } from "./handlers/accounts";
import { walletHandler } from "./handlers/wallet";
import { EventsHandler } from "./handlers/events";
import path from "path"; // Para manipulação de caminhos


// Middleware para servir arquivos estáticos

const port = 3000; 
const server = express();
const routes = Router();

server.use(express.json());

server.use(express.static(path.join("C:/Users/Administrator/Documents/GitHub/Projeto_Integrador-II_Turma_2/frontend"))); // Certifique-se de que o caminho está correto


routes.get('/', (req: Request, res: Response)=>{
    res.statusCode = 403;
    res.send('Acesso não permitido.');
});

routes.put('/signUp', AccountsHandler.createAccountRoute);
routes.post('/login', AccountsHandler.loginRoute);

routes.put('/addNewEvent', EventsHandler.addEventRoute);
routes.get('/getEvents', EventsHandler.getEventsRoute);
routes.delete('/deleteEvent', EventsHandler.deleteEventsRoute);
routes.put('/evaluateEvent', EventsHandler.evaluateNewEventRoute);
routes.get('/searchEvents', EventsHandler.searchEventRoute);

routes.post('/addFunds', walletHandler.addFundsToWalletRoute);
routes.put('/withdrawFunds', walletHandler.withdrawFundsRoute);
routes.post('/betOnEvent', walletHandler.betOnEventRoute);
routes.post('/finishEvent', walletHandler.finishEventRoute);

server.use(routes);

server.listen(port, ()=>{
    console.log(`Server is running on: ${port}`);
})