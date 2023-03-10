import { ROUTES_PATH } from '../constants/routes.js';
import Logout from './Logout.js';

export default class NewBill {
    constructor({ document, onNavigate, store, localStorage }) {
        this.document = document;
        this.onNavigate = onNavigate;
        this.store = store;
        const formNewBill = this.document.querySelector(`form[data-testid="form-new-bill"]`);
        formNewBill.addEventListener('submit', this.handleSubmit);
        const file = this.document.querySelector(`input[data-testid="file"]`);
        file.addEventListener('change', this.handleChangeFile);
        this.fileUrl = null;
        this.fileName = null;
        this.billId = null;
        new Logout({ document, localStorage, onNavigate });
    }

    // --ICI-- handlechangeFile Corrigée
    handleChangeFile = (e) => {
        e.preventDefault();

        const file = this.document.querySelector(`input[data-testid="file"]`).files[0];

        // On récupère l'extention du fichier,
        const fileExtension = file.name.match(/\.[0-9a-z]+$/i)[0];
        // on autorise seulement les formats png, jpg, jpeg
        const authorizedImages = ['.png', '.jpg', '.jpeg'];
        const errorMessage = document.querySelector('[data-testid="file-error-message"]');

        const filePath = e.target.value.split(/\\/g);
        const fileName = filePath[filePath.length - 1];
        const formData = new FormData();
        const email = JSON.parse(localStorage.getItem('user')).email;
        formData.append('file', file);
        formData.append('email', email);

        // si on a une image au format autorisé,
        if (authorizedImages.includes(fileExtension)) {
            // on cache le message d'erreur
            errorMessage.classList.remove('show');
            errorMessage.textContent = '';

            this.store
                .bills()
                .create({
                    data: formData,
                    headers: {
                        noContentType: true,
                    },
                })
                .then(({ fileUrl, key }) => {
                    this.billId = key;
                    this.fileUrl = fileUrl;
                    this.fileName = fileName;
                })
                .catch((error) => console.error(error));
        }
        // Sinon, si l'image n'est pas au bon format,
        else {
            //on réinitialise la valeur à 0.
            e.target.value = '';
            // Et on affiche le message d'ereur
            errorMessage.textContent = 'Fichier au format .jpg, .jpeg ou .png uniquement';
            errorMessage.classList.add('show');
        }
    };

    handleSubmit = (e) => {
        e.preventDefault();
        console.log(
            'e.target.querySelector(`input[data-testid="datepicker"]`).value',
            e.target.querySelector(`input[data-testid="datepicker"]`).value,
        );
        const email = JSON.parse(localStorage.getItem('user')).email;
        const bill = {
            email,
            type: e.target.querySelector(`select[data-testid="expense-type"]`).value,
            name: e.target.querySelector(`input[data-testid="expense-name"]`).value,
            amount: parseInt(e.target.querySelector(`input[data-testid="amount"]`).value),
            date: e.target.querySelector(`input[data-testid="datepicker"]`).value,
            vat: e.target.querySelector(`input[data-testid="vat"]`).value,
            pct: parseInt(e.target.querySelector(`input[data-testid="pct"]`).value) || 20,
            commentary: e.target.querySelector(`textarea[data-testid="commentary"]`).value,
            fileUrl: this.fileUrl,
            fileName: this.fileName,
            status: 'pending',
        };
        this.updateBill(bill);
        this.onNavigate(ROUTES_PATH['Bills']);
    };

    // not need to cover this function by tests
    updateBill = (bill) => {
        if (this.store) {
            this.store
                .bills()
                .update({ data: JSON.stringify(bill), selector: this.billId })
                .then(() => {
                    this.onNavigate(ROUTES_PATH['Bills']);
                })
                .catch((error) => console.error(error));
        }
    };
}
