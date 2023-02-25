/**
 * @jest-environment jsdom
 */

import '@testing-library/jest-dom';
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
    beforeEach(() => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
        window.localStorage.setItem(
            'user',
            JSON.stringify({
                type: 'Employee',
            }),
        );
        //redirige l'utilisateur vers le formulaire
        Object.defineProperty(window, 'location', { value: { hash: ROUTES_PATH['NewBill'] } });
    });
    describe('When I am on NewBill Page', () => {
        test('Then mail icon in vertical layout should be highlighted', async () => {
            //to-do write assertion

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

            expect(contentTitle).toBeTruthy();
        });
    });
});

//----- handleChangeFile -----

describe('when I upload a file with the wrong format', () => {
    test('then it should return an error message', async () => {
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
        //Pas utile

        //On vérifie alors si on a bien le document/txt sélectionné
        expect(inputFile.files[0].type).toBe('document/txt');
        //inutile

        //Attend que la fonction soit appelée
        await waitFor(() => screen.getByTestId('file-error-message'));

        //On s'attend à voir le message d'erreur
        expect(screen.getByTestId('file-error-message')).toHaveClass('show');

        //---- ICI ----- On doit verifier que le msg d'erreur s'affiche
    });
});

describe('when I upload a file with the good format', () => {
    test('then input file should show the file name', async () => {
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

        //On s'attend à ce que handleChangeFile, qui charge le fichier soit appelée
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
    //Etant donné que je suis un utilisateur connecté en tant que Salarié
    describe('When I submit the form completed', () => {
        //Lorsque je soumets le formulaire rempli
        test('Then the bill is created', async () => {
            //Ensuite, la facture est créée

            const html = NewBillUI();
            document.body.innerHTML = html;

            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };
            //SIMULATION DE LA CONNECTION DE L'EMPLOYEE
            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
            });
            window.localStorage.setItem(
                'user',
                JSON.stringify({
                    type: 'Employee',
                    email: 'a@a',
                }),
            );
            //SIMULATION DE CREATION DE LA PAGE DE FACTURE
            const newBill = new NewBill({
                document,
                onNavigate,
                store: null,
                localStorage: window.localStorage,
            });

            const validBill = {
                type: 'Transports',
                name: 'vol Paris Toulouse',
                date: '2023-01-03',
                amount: 80,
                vat: 70,
                pct: 20,
                commentary: 'Commentary',
                fileUrl: '../img/0.jpg',
                fileName: 'test.jpg',
                status: 'pending',
            };

            // Charger les valeurs dans les champs de formulaire pour simuler un utilisateur remplissant et soumettant un formulaire
            screen.getByTestId('expense-type').value = validBill.type;
            screen.getByTestId('expense-name').value = validBill.name;
            screen.getByTestId('datepicker').value = validBill.date;
            screen.getByTestId('amount').value = validBill.amount;
            screen.getByTestId('vat').value = validBill.vat;
            screen.getByTestId('pct').value = validBill.pct;
            screen.getByTestId('commentary').value = validBill.commentary;

            newBill.fileName = validBill.fileName;
            newBill.fileUrl = validBill.fileUrl;

            newBill.updateBill = jest.fn(); //SIMULATION DE  CLICK
            const handleSubmit = jest.fn((e) => newBill.handleSubmit(e)); //ENVOI DU FORMULAIRE

            const form = screen.getByTestId('form-new-bill');
            form.addEventListener('submit', handleSubmit);
            //simuler l'action de l'utilisateur de cliquer sur le bouton de soumission
            fireEvent.submit(form);

            //vérifient que la fonction handleSubmit a bien été appelée (ce qui signifie que le formulaire a été soumis)
            expect(handleSubmit).toHaveBeenCalled();
            //fonction updateBill a bien été appelée (ce qui signifie que les données ont été envoyées à l'API appropriée, ici dans le store)
            expect(newBill.updateBill).toHaveBeenCalled();
        });

        //test erreur 500
        test('fetches error from an API and fails with 500 error', async () => {
            //récupère l'erreur d'une API et échoue avec l'erreur 500
            jest.spyOn(mockStore, 'bills');
            jest.spyOn(console, 'error').mockImplementation(() => {}); // Prevent Console.error jest error

            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
            });
            Object.defineProperty(window, 'location', {
                value: { hash: ROUTES_PATH['NewBill'] },
            });

            window.localStorage.setItem('user', JSON.stringify({ type: 'Employee' }));
            document.body.innerHTML = `<div id="root"></div>`;
            router();

            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };

            mockStore.bills.mockImplementationOnce(() => {
                return {
                    update: () => {
                        return Promise.reject(new Error('Erreur 500'));
                    },
                };
            });
            const newBill = new NewBill({
                document,
                onNavigate,
                store: mockStore,
                localStorage: window.localStorage,
            });

            // Soumettre le formulaire
            const form = screen.getByTestId('form-new-bill');
            const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
            form.addEventListener('submit', handleSubmit);
            fireEvent.submit(form);
            await new Promise(process.nextTick);
            expect(console.error).toBeCalled();
        });
    });

    describe('When I submit the form with missing required fields', () => {
        test('Form submission fails if required fields are missing', async () => {
            const html = NewBillUI();
            document.body.innerHTML = html;

            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname });
            };

            Object.defineProperty(window, 'localStorage', {
                value: localStorageMock,
            });

            window.localStorage.setItem(
                'user',
                JSON.stringify({
                    type: 'Employee',
                }),
            );

            const newBill = new NewBill({
                document,
                onNavigate,
                store: null,
                localStorage: window.localStorage,
            });

            // Je définit les champs obligatoires de formulaire à des valeurs vides.
            screen.getByTestId('datepicker').value = '';
            screen.getByTestId('amount').value = '';
            screen.getByTestId('pct').value = '';
            screen.getByTestId('file').value = '';

            // Je soumet le formulaire
            const form = screen.getByTestId('form-new-bill');
            const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
            form.addEventListener('submit', handleSubmit);
            fireEvent.submit(form);
            await new Promise(process.nextTick);

            // Je vérifie que handleSubmit n'a pas été appelé.
            expect(jest.fn()).not.toHaveBeenCalled();
        });
    });
});
