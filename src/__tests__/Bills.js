/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import Bills from '../containers/Bills.js';
import store from '../__mocks__/store.js';
import mockStore from '../__mocks__/store';
import router from '../app/Router.js';

jest.mock('../app/store', () => mockStore);

describe('Given I am connected as an employee', () => {
    describe('When I am on Bills Page', () => {
        test('Then bill icon in vertical layout should be highlighted', async () => {
            Object.defineProperty(window, 'localStorage', { value: localStorageMock });
            window.localStorage.setItem(
                'user',
                JSON.stringify({
                    type: 'Employee',
                }),
            );
            const root = document.createElement('div');
            root.setAttribute('id', 'root');
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.Bills);
            await waitFor(() => screen.getByTestId('icon-window'));
            const windowIcon = screen.getByTestId('icon-window');
            //to-do write expect expression
            //ICI on attend que la classe sur windowIcon soit active-icon (et pas seulement vraie).
            expect(windowIcon.className).toBe('active-icon');
        });
        test('Then bills should be ordered from earliest to latest', () => {
            document.body.innerHTML = BillsUI({ data: bills });
            const dates = screen
                .getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i)
                .map((a) => a.innerHTML);
            const antiChrono = (a, b) => (a < b ? 1 : -1);
            const datesSorted = [...dates].sort(antiChrono);
            expect(dates).toEqual(datesSorted);
        });
    });
});

/**
 * -----ajout nouveaux tests --------------
 * -----------------------------------------
 */
//----- getBills -----
describe('---', () => {
    test('Given we try to get bills without store', () => {
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem(
            'user',
            JSON.stringify({
                type: 'Admin',
            }),
        );

        const bills = new Bills({ document, onNavigate, store: null, localStorage: window.localStorage });
        const result = bills.getBills();
        expect(result).toBe(undefined);
    });

    test('Given we try to get bills with store', async () => {
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };

        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem(
            'user',
            JSON.stringify({
                type: 'Admin',
            }),
        );

        const bills = new Bills({ document, onNavigate, store: store, localStorage: window.localStorage });
        const result = await bills.getBills();
        expect(result.length).toBe(4);
        expect(result[0].type).toBe('Hôtel et logement');
    });

    // test('Then, Error page should be rendered', () => {
    //     document.body.innerHTML = BillsUI({ error: 'some error message' });
    //     expect(screen.getAllByText('Erreur')).toBeTruthy();
    // });
});

// describe('When I am on Dashboard page but back-end send an error message', () => {
//     test('Then, Error page should be rendered', () => {
//         const html = BillsUI({ error: 'some error message' });
//         document.body.innerHTML = html;
//         expect(screen.getAllByText('Erreur')).toBeTruthy();
//     });
// });

//----- handleClickNewBill -----
describe('When I click on button new-bill', () => {
    test('Then the modal new Bill should open', () => {
        //aiguille les routes des fichiers js.
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };
        //Création d'un objet facture
        const bill = new Bills({ document, onNavigate, store, localStorage: window.localStorage });

        //Simulation de la fonction handleClickNewBill de l'objet bill
        const handleClickNewBill = jest.fn((e) => bill.handleClickNewBill(e));

        //getByTestId va faire une requête ds le DOM:récupère des éléments via l’attribut data-testid
        const buttonNewBill = screen.getByTestId('btn-new-bill');

        //Ajout du listener sur le bouton
        buttonNewBill.addEventListener('click', handleClickNewBill);

        //Appel de userEvent pour générer l'evenement.
        userEvent.click(buttonNewBill);

        //On s'attend à ce que handleClickNewBill, qui clique sur le bouton, soit appelée
        expect(handleClickNewBill).toHaveBeenCalled();

        //On s'attend à voir le texte "Envoyer une note de frais".
        expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy();

        //getByTestId va faire une requête ds le DOM:récupère des éléments via l’attribut data-testid
        expect(screen.getByTestId('form-new-bill')).toBeTruthy();
    });
});

//----- handleClickIconEye -----
describe('When I am on Bills Page and I click on the icon Eye', () => {
    //La modale avec la piece justificative apparaît
    test('Then modal with supporting documents appears', () => {
        //aiguille les routes des fichiers js.
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };

        //Lien vers les données mockées
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // Définit l'utilisateur comme employé dans le localStorage
        // JSON.stringify = Renvoie une chaîne de caractère qui est du json.
        window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));

        //La modale est dans $.fn.modal ?, jest.fn() = fonction simulée
        $.fn.modal = jest.fn(); // Prevent jQuery error

        //afficher les factures triées
        const html = BillsUI({ data: bills?.sort((a, b) => (a.date < b.date ? 1 : -1)) });
        document.body.innerHTML = html;

        //Création d'un objet facture
        const billsContainer = new Bills({
            document,
            onNavigate,
            store: store,
            localStorage: window.localStorage,
        });

        //Screen vient de testing library,
        //getByTestId va faire une requête ds le DOM:
        //récupère des éléments via les attributs data-testid
        const iconEye = screen.getAllByTestId('icon-eye')[0];

        //Simulation de la fonction handleClickIconEye de l'objet billsContainer
        const handleShowModalFile = jest.fn((e) => {
            billsContainer.handleClickIconEye(e.target);
        });

        //Listener sur l'icône de l'oeil
        iconEye.addEventListener('click', handleShowModalFile);

        //Appel de userEvent pour générer l'evenement.
        userEvent.click(iconEye);

        //On s'attend à ce que handleShowModalFile, qui ouvre la modale, soit appelée
        expect(handleShowModalFile).toHaveBeenCalled();

        //On vérifie alors si on a bien le message "justificatif" qui est présent en haut de la modale
        expect(screen.getAllByText('Justificatif')).toBeTruthy();
    });
});

// ----- test d'intégration GET -----
describe('Given I am a user connected as Employee', () => {
    describe('When I navigate to Bills page', () => {
        //récupère les factures de l'API simulée GET
        test('fetches bills from mock API GET', async () => {
            // Définit l'utilisateur comme employé dans le localStorage
            // JSON.stringify = Renvoie une chaîne de caractère qui est du json
            localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));

            //Simulation d'une navigation vers une page html.
            const root = document.createElement('div');
            root.setAttribute('id', 'root');
            document.body.append(root);

            //Le router injecte les pages dans le DOM
            router();

            //Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
            window.onNavigate(ROUTES_PATH.Bills);

            //Attend que la fonction soit appelée
            //Ici on s'attend à voir le message mes notes de frais.
            await waitFor(() => expect(screen.getByText('Mes notes de frais')).toBeTruthy());
        });

        describe('When an error occurs on API', () => {
            // beforeEach: pour réaliser des opérations avant chaque test
            beforeEach(() => {
                //Permet de mettre un espion sur une fonction qui est executée par une autre fonction test.
                jest.spyOn(store, 'bills');
                // permet de définir une propriété d'objet (ici window) et/ou de modifier la valeur et/ou les métadonnées d'une propriété.
                Object.defineProperty(window, 'localStorage', { value: localStorageMock });

                // Définit l'utilisateur comme employé dans le localStorage
                window.localStorage.setItem(
                    'user',
                    JSON.stringify({
                        type: 'Employee',
                        email: 'a@a',
                    }),
                );

                //Simulation d'une navigation vers une page html.
                const root = document.createElement('div');
                root.setAttribute('id', 'root');
                document.body.appendChild(root);

                //Le router injecte les pages dans le DOM
                router();
            });

            //récupère les factures de l'API et echoue avec un message 404
            test('fetches bills from an API and fails with 404 message error', async () => {
                //mockImplementationOnce: Accepte une fonction qui sera utilisée comme une implémentation
                //de simulation pour un appel à la fonction simulée.
                //Peut être enchaîné de sorte que plusieurs appels de fonction produisent des résultats différents.
                //Ici on appelle la fonction list() de store.js et on simule le rejet de la promesse
                //Puis création d'un objet qui simule une erreur.
                store.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error('Erreur 404'));
                        },
                    };
                });

                //Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
                window.onNavigate(ROUTES_PATH.Bills);

                //Lorsque nous passons une fonction à process.nextTick(),
                //nous demandons au moteur d'appeler cette fonction à la
                //process.nextTick: fin de l'opération en cours, avant le démarrage de la prochaine boucle d'événement:
                await new Promise(process.nextTick);

                //On s'attend à voir affichée l'erreur.
                const message = await screen.getByText(/Erreur 404/);
                expect(message).toBeTruthy();
            });

            //fetches messages from an API and fails with 500 message error
            test('fetches messages from an API and fails with 500 message error', async () => {
                //mockImplementationOnce: Accepte une fonction qui sera utilisée comme une implémentation
                //de simulation pour un appel à la fonction simulée.
                //Peut être enchaîné de sorte que plusieurs appels de fonction produisent des résultats différents.
                //Ici on appelle la fonction list() de store.js et on simule le rejet de la promesse
                //Puis création d'un objet qui simule une erreur.
                store.bills.mockImplementationOnce(() => {
                    return {
                        list: () => {
                            return Promise.reject(new Error('Erreur 500'));
                        },
                    };
                });

                //Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
                window.onNavigate(ROUTES_PATH.Bills);

                //process.nextTick: fin de l'opération en cours, avant le démarrage de la prochaine boucle d'événement:
                await new Promise(process.nextTick);

                //On s'attend à voir affichée l'erreur.
                const message = await screen?.getByText(/Erreur 500/);
                expect(message).toBeTruthy();
            });
        });
    });
});
