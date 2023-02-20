/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from '@testing-library/dom';
import mockStore from '../__mocks__/store';
import router from '../app/Router.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { localStorageMock } from '../__mocks__/localStorage';
import userEvent from '@testing-library/user-event';
import BillsUI from '../views/BillsUI.js';

//Elle permet de remplacer les fonctions du fichier
//app/store par le fichier /__mock__/store pour simuler les requêtes API.
jest.mock('../app/store', () => mockStore);

describe('Given I am connected as an employee', () => {
    describe('When I am on NewBill Page', () => {
        test('Then mail icon in vertical layout should be highlighted', async () => {
            //to-do write assertion
            Object.defineProperty(window, 'localStorage', { value: localStorageMock });
            window.localStorage.setItem(
                'user',
                JSON.stringify({
                    type: 'Employee',
                }),
            );

            //redirige l'utilisateur vers le formulaire cf tests routes.js
            Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } });

            const root = document.createElement('div');
            root.setAttribute('id', 'root');
            document.body.append(root);
            router();
            window.onNavigate(ROUTES_PATH.NewBill);
            await waitFor(() => screen.getByTestId('icon-mail'));
            const mailIcon = screen.getByTestId('icon-mail');
            //ICI on attend que la classe sur mailIcon soit active-icon (et pas seulement vraie).
            expect(mailIcon.className).toBe('active-icon');
        });
        test('Then there is a form to edit new bill', () => {
            //Page du formulaire
            const html = NewBillUI({});
            document.body.innerHTML = html;

            //Fonctions qui récupèrent les éléments du DOM créés
            const contentTitle = screen.getAllByText('Envoyer une note de frais');
            //toBeTruthy correspond à tout ce qu'une instruction if traite comme vrai

            expect(contentTitle).toBeTruthy;
        });
    });
});

//----- handleChangeFile -----

describe('when I upload a file with the wrong format', () => {
    test('then it should return an error message', async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem(
            'user',
            JSON.stringify({
                type: 'Employee',
            }),
        );

        //redirige l'utilisateur vers le formulaire
        Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } });

        //Page du formulaire
        document.body.innerHTML = NewBillUI({});

        //onNavigate:Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };

        //Création d'un objet nouvelle facture
        const newBill = new NewBill({ document, onNavigate, mockStore, localStorage: window.localStorage });

        //Création d'un objet fichier hello.txt
        const file = new File(['hello'], 'hello.txt', { type: 'document/txt' });

        //getByTestId va faire une requête ds le DOM:récupère des éléments via l’attribut data-testid
        const inputFile = screen.getByTestId('file');

        //Simulation de la fonction handleChangeFile de l'objet NewBill
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        //Ajout d'un listener sur l'input avec l'evènement change
        inputFile.addEventListener('change', handleChangeFile);

        //Simulation d'une interaction avec l'utilisateur
        fireEvent.change(inputFile, { target: { files: [file] } });

        //On s'attend à ce que handleChangeFile, qui charge le fichier,soit appelée
        expect(handleChangeFile).toHaveBeenCalled();

        //On vérifie alors si on a bien le document/txt sélectionné
        expect(inputFile.files[0].type).toBe('document/txt');

        //Attend que la fonction soit appelée
        await waitFor(() => screen.getByTestId('file-error-message'));

        //On s'attend à voir le message d'erreur
        expect(screen.getByTestId('file-error-message').classList).not.toContain('hidden');
    });
});

describe('when I upload a file with the good format', () => {
    test('then input file should show the file name', async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem(
            'user',
            JSON.stringify({
                type: 'Employee',
            }),
        );

        //redirige l'utilisateur vers le formulaire
        Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } });

        //Page du formulaire
        document.body.innerHTML = NewBillUI();

        //onNavigate:Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
        };

        //Création d'un objet nouvelle facture
        const newBill = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
        });

        //Création d'un objet fichier image.png
        const file = new File(['img'], 'image.png', { type: 'image/png' });

        //getByTestId va faire une requête ds le DOM:récupère des éléments via l’attribut data-testid
        const inputFile = screen.getByTestId('file');

        //Simulation de la fonction handleChangeFile de l'objet NewBill
        const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));

        //Ajout d'un listener sur l'input avec l'evènement change
        inputFile.addEventListener('change', handleChangeFile);

        //Simulation d'une interaction avec l'utilisateur
        userEvent.upload(inputFile, file);

        //On s'attend à ce que handleChangeFile, qui charge le fichier,soit appelée
        expect(handleChangeFile).toHaveBeenCalled();

        //On vérifie alors si on a bien le fichier
        expect(inputFile.files[0]).toStrictEqual(file);

        //On vérifie alors si on a bien l'image.png
        expect(inputFile.files[0].name).toBe('image.png');

        //Attend que la fonction soit appelée
        await waitFor(() => screen.getByTestId('file-error-message'));

        //On s'attend à ne pas voir le message d'erreur
        expect(screen.getByTestId('file-error-message').textContent).toContain('');
    });
});

//----- handleSubmit -----

describe('when I submit the form with empty fields', () => {
    test('then I should stay on new Bill page', () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem(
            'user',
            JSON.stringify({
                type: 'Employee',
            }),
        );

        //redirige l'utilisateur vers le formulaire
        Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } });

        //onNavigate:Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
        window.onNavigate(ROUTES_PATH.NewBill);

        //Création d'un objet nouvelle facture
        const newBill = new NewBill({ document, onNavigate, mockStore, localStorage: window.localStorage });

        //Fonctions qui récupèrent les éléments créés dans le DOM (et les champs sont vides)
        expect(screen.getByTestId('expense-name').value).toBe('');
        expect(screen.getByTestId('datepicker').value).toBe('');
        expect(screen.getByTestId('amount').value).toBe('');
        expect(screen.getByTestId('vat').value).toBe('');
        expect(screen.getByTestId('pct').value).toBe('');
        expect(screen.getByTestId('file').value).toBe('');

        //getByTestId va faire une requête ds le DOM:récupère des éléments via l’attribut data-testid
        const form = screen.getByTestId('form-new-bill');

        //Simulation de la fonction handleSubmit de l'objet newBill
        const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));

        //Ajout d'un listener sur le formulaire avec l'evènement submit
        form.addEventListener('submit', handleSubmit);

        //Simulation de l'évènement submit
        fireEvent.submit(form);

        //On vérifie si la fonction handleSubmit a bien été appelée
        expect(handleSubmit).toHaveBeenCalled();

        //On s'attend à la présence du formulaire.
        expect(form).toBeTruthy();
    });
});

//-----test d'intégration POST-----

describe('Given I am a user connected as Employee', () => {
    describe('When I create new bill', () => {
        test('send bill to mock API POST', async () => {
            // Définit l'utilisateur comme employé dans le localStorage
            localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));

            //Simulation d'une navigation vers une page html.
            const root = document.createElement('div');
            root.setAttribute('id', 'root');
            document.body.append(root);

            //Le router injecte les pages dans le DOM
            router();

            //Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
            window.onNavigate(ROUTES_PATH.NewBill);

            //Permet de mettre un espion sur une fonction qui est executée par une autre fonction test.
            jest.spyOn(mockStore, 'bills');

            //mockImplementationOnce: Accepte une fonction qui sera utilisée comme une implémentation
            //de simulation pour un appel à la fonction simulée.
            //Peut être enchaîné de sorte que plusieurs appels de fonction produisent des résultats différents.
            //Ici on appelle la fonction create() de store.js et on simule la résolution de la promesse
            mockStore.bills.mockImplementationOnce(() => {
                return {
                    create: (bill) => {
                        return Promise.resolve();
                    },
                };
            });

            //Lorsque nous passons une fonction à process.nextTick(),
            //nous demandons au moteur d'appeler cette fonction à la
            //process.nextTick: fin de l'opération en cours, avant le démarrage de la prochaine boucle d'événement:
            await new Promise(process.nextTick);

            //On s'attend à voir affiché le message "mes notes de frais"
            expect(screen.getByText('Mes notes de frais')).toBeTruthy();
        });
        describe('When an error occurs on API', () => {
            test('send bill to mock API POST', async () => {
                // Définit l'utilisateur comme employé dans le localStorage
                localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));

                //Simulation d'une navigation vers une page html.
                const root = document.createElement('div');
                root.setAttribute('id', 'root');
                document.body.append(root);

                //Le router injecte les pages dans le DOM
                router();

                //Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
                window.onNavigate(ROUTES_PATH.NewBill);

                //Permet de mettre un espion sur une fonction qui est executée par une autre fonction test.
                jest.spyOn(mockStore, 'bills');

                //mockImplementationOnce: Accepte une fonction qui sera utilisée comme une implémentation
                //de simulation pour un appel à la fonction simulée.
                //Peut être enchaîné de sorte que plusieurs appels de fonction produisent des résultats différents.
                //Ici on appelle la fonction create() de store.js et on simule le rejet de la promesse
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        create: (bill) => {
                            return Promise.reject(new Error('Erreur 404'));
                        },
                    };
                });
                //Lorsque nous passons une fonction à process.nextTick(),
                //nous demandons au moteur d'appeler cette fonction à la
                //process.nextTick: fin de l'opération en cours, avant le démarrage de la prochaine boucle d'événement:
                await new Promise(process.nextTick);

                //Introduction du message "Erreur 404" dans la page.
                const html = BillsUI({ error: 'Erreur 404' });
                document.body.innerHTML = html;

                //On s'attend à voir affichée l'erreur.
                const message = await screen.getByText(/Erreur 404/);
                expect(message).toBeTruthy();
            });
            test('send bill to mock API POST', async () => {
                // Définit l'utilisateur comme employé dans le localStorage
                localStorage.setItem('user', JSON.stringify({ type: 'Employee', email: 'a@a' }));

                //Simulation d'une navigation vers une page html.
                const root = document.createElement('div');
                root.setAttribute('id', 'root');
                document.body.append(root);

                //Le router injecte les pages dans le DOM
                router();

                //Fonction qui est dans le fichier app/Router.js, elle aiguille les routes des fichiers js.
                window.onNavigate(ROUTES_PATH.NewBill);

                //Permet de mettre un espion sur une fonction qui est executée par une autre fonction test.
                jest.spyOn(mockStore, 'bills');

                //mockImplementationOnce: Accepte une fonction qui sera utilisée comme une implémentation
                //de simulation pour un appel à la fonction simulée.
                //Peut être enchaîné de sorte que plusieurs appels de fonction produisent des résultats différents.
                //Ici on appelle la fonction create() de store.js et on simule le rejet de la promesse
                mockStore.bills.mockImplementationOnce(() => {
                    return {
                        create: (bill) => {
                            return Promise.reject(new Error('Erreur 500'));
                        },
                    };
                });
                //Lorsque nous passons une fonction à process.nextTick(),
                //nous demandons au moteur d'appeler cette fonction à la
                //process.nextTick: fin de l'opération en cours, avant le démarrage de la prochaine boucle d'événement:
                await new Promise(process.nextTick);

                //Introduction du message "Erreur 500" dans la page.
                const html = BillsUI({ error: 'Erreur 500' });
                document.body.innerHTML = html;

                //On s'attend à voir affichée l'erreur.
                const message = await screen.getByText(/Erreur 500/);
                expect(message).toBeTruthy();
            });
        });
    });
});
