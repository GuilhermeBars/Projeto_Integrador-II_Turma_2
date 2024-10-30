//Pastas separadas 
//Falta implementar betonEvent, evaluateNewEvent,finishEvent]
// Define a rota para adicionar um novo evento
import { Request, Response, RequestHandler, response } from "express";
import OracleDB from "oracledb";
import dotenv from 'dotenv'; 
import {resolve} from 'path'; 

// Carrega as variáveis de ambiente a partir do arquivo .env especificado
dotenv.config({ path: resolve('C:/workspace/outros/.env') });

// Define um namespace para agrupar os manipuladores relacionados a contas e eventos
export namespace AccountsHandler {
    
    // Define o tipo UserAccount, que representa uma conta de usuário
    export type UserAccount = {
        name:string; 
        email:string; 
        password:string; 
        birthdate:string; 
    };

    // Define o tipo Event, que representa um evento
    export type Event = {
        title:string; 
        desc:string; 
        team1:string; 
        team2:string; 
        date:string; 
        hour:string; 
    }

    // Banco de dados em memória para armazenar as contas de usuário
    let accountsDatabase: UserAccount[] = [];

    // Banco de dados em memória para armazenar os eventos
    let eventsDatabase: Event[] = [];

    // Função para salvar um novo evento no banco de dados em memória
    export function saveNewEvent(ne: Event) : number{
        eventsDatabase.push(ne); 
        return eventsDatabase.length; 
    }



export const addEventRoute: RequestHandler = (req: Request, res: Response) => {
    const pTitle = req.get('title'); 
    const pDesc = req.get('desc'); 
    const pTeam1 = req.get('team1'); 
    const pTeam2 = req.get('team2');
    const pDate = req.get('date');
    const pHour = req.get('hour'); 

    if (pTitle && pDesc && pTeam1 && pTeam2 && pDate && pHour) {
        // Cria um novo objeto Event com os dados fornecidos
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

// Define a rota para obter todos os eventos armazenados
export const getEventsRoute: RequestHandler = (req: Request, res: Response) => {
    if (eventsDatabase.length === 0) { 
        res.statusCode = 200; 
        res.send("Nenhum evento encontrado."); 
        return;
    }

    else {
        let eventsList = ''; 

        // Itera sobre todos os eventos no banco de dados e formata suas informações
        for (let i = 0; i < eventsDatabase.length; i++) {
            eventsList += `Evento ${i+1}: ${eventsDatabase[i].title}\n` +
                        `Descrição: ${eventsDatabase[i].desc}\n` +
                        `Data: ${eventsDatabase[i].date} ${eventsDatabase[i].hour}\n\n`;
        }
    
        res.statusCode = 200; 
        res.send(eventsList); 
    }
    
}

// Define a rota para deletar um evento pelo índice fornecido
export const deleteEventsRoute: RequestHandler = (req: Request, res: Response) => {
    const index = Number(req.get('index')) - 1; // Obtém o índice do evento a ser deletado (ajustado para base 0)

    if (!isNaN(index) && index >= 0 && index < eventsDatabase.length) { 
        const deletedEvent = eventsDatabase.splice(index, 1); // Remove o evento do banco de dados
        res.statusCode = 200; 
        res.send(`Evento "${deletedEvent[0].title}" deletado com sucesso.`); // Envia a resposta confirmando a exclusão
    } 
    
    else {
        res.statusCode = 400; 
        res.send("Índice inválido ou fora do alcance."); 
    }
}

}

// Função para buscar eventos por palavra-chave no banco de dados Oracle
export const searchEventRoute: RequestHandler = async (req: Request, res: Response) => {
const keyword = req.get('keyword'); // Palavra-chave de busca fornecida na requisição

if (!keyword) {
    res.statusCode = 400;
    res.send("Você precisa informar uma palavra-chave para a busca.");
    return;
}

OracleDB.outFormat = OracleDB.OUT_FORMAT_OBJECT;

// Conecta ao banco de dados Oracle
const connection = await OracleDB.getConnection({
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectString: process.env.ORACLE_CONN_STR
});

// Busca eventos que tenham a palavra-chave no título ou descrição, nao tem muito mais lugar pra procurar
const result: any = await connection.execute(
`SELECT * FROM EVENTS WHERE LOWER(title) LIKE :keyword OR LOWER(desc) LIKE :keyword`,
[ `%${keyword.toLowerCase()}%` ]
);
await connection.close(); 

if (result.rows.length > 0) {
    let eventsList = '';
    
    // Percorre todos os eventos encontrados e formata as informações
    for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        eventsList += `Evento ${i + 1}:
                    ` +`Título: ${row.TITLE}
                    ` +`Descrição: ${row.DESC}
                    ` +`Time 1: ${row.TEAM1}
                    ` +`Time 2: ${row.TEAM2}
                    ` +`Data: ${row.DATE}
                    ` +`Hora: ${row.HOUR}

`;
    }
    res.statusCode = 200;
    res.send(eventsList); // Retorna os eventos encontrados cada um como uma stringzona como ali em cima 
} else {
    res.statusCode = 200;
    res.send("Nenhum evento foi encontrado que contém essa palvara.");
}
};