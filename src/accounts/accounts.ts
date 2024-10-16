import {Request, RequestHandler, Response} from "express";

export namespace AccountsHandler {
    
    export type UserAccount = {
        name:string;
        email:string;
        password:string;
        birthdate:string; 
    };

    export type Event = {
        title:string;
        desc:string;
        team1:string;
        team2:string;
        date:string;
        hour:string;
    }

    let accountsDatabase: UserAccount[] = [];

    let eventsDatabase: Event[] = [];

    export function saveNewAccount(ua: UserAccount) : number{
        accountsDatabase.push(ua);
        return accountsDatabase.length;
    }

    export function saveNewEvent(ne: Event) : number{
        eventsDatabase.push(ne);
        return eventsDatabase.length;
    }

    export const createAccountRoute: RequestHandler = (req: Request, res: Response) => {
        const pName = req.get('name');
        const pEmail = req.get('email');
        const pPassword = req.get('password');
        const pBirthdate = req.get('birthdate');
        
        if (pName && pEmail && pPassword && pBirthdate) {
            const newAccount: UserAccount = {
                name: pName,
                email: pEmail, 
                password: pPassword,
                birthdate: pBirthdate
            }
            const ID = saveNewAccount(newAccount);
            res.statusCode = 200; 
            res.send(`Nova conta adicionada. Código: ${ID}`);
        }

        else {
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

    export const loginRoute: RequestHandler = (req: Request, res: Response) => {
        const pEmail = req.get('email');
        const pPassword = req.get('password');

        if (pEmail && pPassword) {
            const userAccount = accountsDatabase.find(account => {
                const emailEncontrado = account.email === pEmail;
                const passwordEncontrado = account.password === pPassword;
              
                if (emailEncontrado && passwordEncontrado) {
                  return account;
                }
            });
              

            if (userAccount) {
                res.statusCode = 200;
                res.send(`Login bem-sucedido! Bem-vindo, ${userAccount.name}.`);
            } 
            
            else {
                res.statusCode = 401;
                res.send('Email ou senha incorretos.');
            }
        }

        else {
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

    export const addEventRoute: RequestHandler = (req: Request, res: Response) => {
        const pTitle = req.get('title');
        const pDesc = req.get('desc');
        const pTeam1 = req.get('team1');
        const pTeam2 = req.get('team2');
        const pDate = req.get('date');
        const pHour = req.get('hour');

        if (pTitle && pDesc && pTeam1 && pTeam2 && pDate && pHour) {
            const newEvent: Event = {
                title: pTitle,
                desc: pDesc,
                team1: pTeam1,
                team2: pTeam2,
                date: pDate,
                hour: pHour,
            }
            const ID = saveNewEvent(newEvent);
            res.statusCode = 200; 
            res.send(`Novo evento adicionado. Código: ${ID}`);
        }

        else {
            res.statusCode = 400;
            res.send("Parâmetros inválidos ou faltantes.");
        }
    }

    export const getEventsRoute: RequestHandler = (req: Request, res: Response) => {
        if (eventsDatabase.length === 0) {
            res.statusCode = 200;
            res.send("Nenhum evento encontrado.");
            return;
        }
    
        else {
            let eventsList = '';
    
            for (let i = 0; i < eventsDatabase.length; i++) {
                eventsList += `Evento ${i+1}: ${eventsDatabase[i].title}\n` +
                            `Descrição: ${eventsDatabase[i].desc}\n` +
                            `Data: ${eventsDatabase[i].date} ${eventsDatabase[i].hour}\n\n`;
            }
        
            res.statusCode = 200;
            res.send(eventsList);
        }
        
    }
    

    export const deleteEventsRoute: RequestHandler = (req: Request, res: Response) => {
        const index = Number(req.get('index')) - 1;
    
        if (!isNaN(index) && index >= 0 && index < eventsDatabase.length) {
            const deletedEvent = eventsDatabase.splice(index, 1);
            res.statusCode = 200;
            res.send(`Evento "${deletedEvent[0].title}" deletado com sucesso.`);
        } 
        
        else {
            res.statusCode = 400;
            res.send("Índice inválido ou fora do alcance.");
        }
    }

}
