import { formatDate } from '../app/format.js';
import DashboardFormUI from '../views/DashboardFormUI.js';
import BigBilledIcon from '../assets/svg/big_billed.js';
import { ROUTES_PATH } from '../constants/routes.js';
import USERS_TEST from '../constants/usersTest.js';
import Logout from './Logout.js';

export const filteredBills = (data, status) => {
    return data && data.length
        ? data.filter((bill) => {
              let selectCondition;

              // in jest environment
              if (typeof jest !== 'undefined') {
                  selectCondition = bill.status === status;
              } else {
                  /* istanbul ignore next */
                  // in prod environment
                  const userEmail = JSON.parse(localStorage.getItem('user')).email;
                  selectCondition =
                      bill.status === status && ![...USERS_TEST, userEmail].includes(bill.email);
              }

              return selectCondition;
          })
        : [];
};

export const card = (bill) => {
    const firstAndLastNames = bill.email.split('@')[0];
    const firstName = firstAndLastNames.includes('.') ? firstAndLastNames.split('.')[0] : '';
    const lastName = firstAndLastNames.includes('.') ? firstAndLastNames.split('.')[1] : firstAndLastNames;

    return `
    <div class='bill-card' id='open-bill${bill.id}' data-testid='open-bill${bill.id}'>
      <div class='bill-card-name-container'>
        <div class='bill-card-name'> ${firstName} ${lastName} </div>
        <span class='bill-card-grey'> ... </span>
      </div>
      <div class='name-price-container'>
        <span> ${bill.name} </span>
        <span> ${bill.amount} € </span>
      </div>
      <div class='date-type-container'>
        <span> ${formatDate(bill.date)} </span>
        <span> ${bill.type} </span>
      </div>
    </div>
  `;
};

export const cards = (bills) => {
    return bills && bills.length ? bills.map((bill) => card(bill)).join('') : '';
};

export const getStatus = (index) => {
    switch (index) {
        case 1:
            return 'pending';
        case 2:
            return 'accepted';
        case 3:
            return 'refused';
    }
};

export default class {
    constructor({ document, onNavigate, store, bills, localStorage }) {
        this.document = document;
        this.onNavigate = onNavigate;
        this.store = store;
        //---PROBLEME--- A chaque fois qu'on clique sur une fleche, on ajoute un addEventListener sur toutes les bills,
        // comme il y en a 3 on ajoute un addEventListener sur la meme facture.
        $('#arrow-icon1').click((e) => this.handleShowTickets(e, bills, 1));
        $('#arrow-icon2').click((e) => this.handleShowTickets(e, bills, 2));
        $('#arrow-icon3').click((e) => this.handleShowTickets(e, bills, 3));
        new Logout({ localStorage, onNavigate });
    }

    handleClickIconEye = () => {
        const billUrl = $('#icon-eye-d').attr('data-bill-url');
        //J'affiche la facture
        console.log('billUrl: ' + billUrl);
        //Je met dans une const la facture qui comprend la valeur est null
        const isBillNull = billUrl.includes('null');
        //J'affiche cette constante.
        console.log('isBillNull =>', isBillNull);
        const imgWidth = Math.floor($('#modaleFileAdmin1').width() * 0.8);
        $('#modaleFileAdmin1')
            .find('.modal-body')
            .html(
                //Si la facture est nulle alors on affiche le message personalisé, sinon, on affiche la facture.
                isBillNull
                    ? `<div style='text-align: center;'><p> Facture inexistante </p></div>`
                    : `<div style='text-align: center;'><img width=${imgWidth} src=${billUrl} alt="Bill"/></div>`,
            );
        if (typeof $('#modaleFileAdmin1').modal === 'function') $('#modaleFileAdmin1').modal('show');
    };

    handleEditTicket(e, bill, bills) {
        if (this.counter === undefined || this.id !== bill.id) this.counter = 0;
        if (this.id === undefined || this.id !== bill.id) this.id = bill.id;
        if (this.counter % 2 === 0) {
            bills.forEach((b) => {
                $(`#open-bill${b.id}`).css({ background: '#0D5AE5' });
            });
            $(`#open-bill${bill.id}`).css({ background: '#2A2B35' });
            $('.dashboard-right-container div').html(DashboardFormUI(bill));
            $('.vertical-navbar').css({ height: '150vh' });
            this.counter++;
        } else {
            $(`#open-bill${bill.id}`).css({ background: '#0D5AE5' });

            $('.dashboard-right-container div').html(`
        <div id="big-billed-icon" data-testid="big-billed-icon"> ${BigBilledIcon} </div>
      `);
            $('.vertical-navbar').css({ height: '120vh' });
            this.counter++;
        }
        $('#icon-eye-d').click(this.handleClickIconEye);
        $('#btn-accept-bill').click((e) => this.handleAcceptSubmit(e, bill));
        $('#btn-refuse-bill').click((e) => this.handleRefuseSubmit(e, bill));
    }

    handleAcceptSubmit = (e, bill) => {
        const newBill = {
            ...bill,
            status: 'accepted',
            commentAdmin: $('#commentary2').val(),
        };
        this.updateBill(newBill);
        this.onNavigate(ROUTES_PATH['Dashboard']);
    };

    handleRefuseSubmit = (e, bill) => {
        const newBill = {
            ...bill,
            status: 'refused',
            commentAdmin: $('#commentary2').val(),
        };
        this.updateBill(newBill);
        this.onNavigate(ROUTES_PATH['Dashboard']);
    };

    handleShowTickets(e, bills, index) {
        if (this.counter === undefined || this.index !== index) this.counter = 0;
        if (this.index === undefined || this.index !== index) this.index = index;
        if (this.counter % 2 === 0) {
            $(`#arrow-icon${this.index}`).css({ transform: 'rotate(0deg)' });
            $(`#status-bills-container${this.index}`).html(
                cards(filteredBills(bills, getStatus(this.index))),
            );
            this.counter++;
        } else {
            $(`#arrow-icon${this.index}`).css({ transform: 'rotate(90deg)' });
            $(`#status-bills-container${this.index}`).html('');
            this.counter++;
        }
        // ---SOLUTION --- Une fois qu'on a bouclé sur un bills il faut qu'on sache qu'on lui a mis un eventListener
        // pour ne pas avoir à le faire de nouveau.
        bills.forEach((bill) => {
            //Pour pouvoir savoir si on a bouclé sur un elt, si il n'y a pas de eventListener alors on en met un.
            //Si l'élément HTML de la facture (avec son id) n'a pas encore été associé à un événement "click".
            if (!$(`#open-bill${bill.id}`).data('data-isWithEventListener')) {
                // Alors on s'assure que si l'utilisateur clique sur l'élément plusieurs fois, l'événement "click" ne sera exécutée qu'une seule fois.
                $(`#open-bill${bill.id}`).data('data-isWithEventListener', true);
                //Et on ajout un evenement click sur l'element ce qui appelle la fonction qui edite le ticket.
                $(`#open-bill${bill.id}`).click((e) => this.handleEditTicket(e, bill, bills));
            }
        });
        return bills;
    }

    getBillsAllUsers = () => {
        if (this.store) {
            return this.store
                .bills()
                .list()
                .then((snapshot) => {
                    const bills = snapshot.map((doc) => ({
                        id: doc.id,
                        ...doc,
                        date: doc.date,
                        status: doc.status,
                    }));
                    return bills;
                })
                .catch((error) => {
                    throw error;
                });
        }
    };

    // not need to cover this function by tests
    /* istanbul ignore next */
    updateBill = (bill) => {
        if (this.store) {
            return this.store
                .bills()
                .update({ data: JSON.stringify(bill), selector: bill.id })
                .then((bill) => bill)
                .catch(console.log);
        }
    };
}
