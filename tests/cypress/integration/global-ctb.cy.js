// <reference types="Cypress" />
const products = require('../fixtures/products.json');
const ctbGET = require('../fixtures/ctbGET.json');

describe('Click to buy', function () {

	before(() => {
		cy.intercept({
			method: 'GET',
			url: /newfold-marketplace(\/|%2F)v1(\/|%2F)marketplace/
		}, products ).as('products');

		cy.visit('/wp-admin/admin.php?page=' + Cypress.env('pluginId') + '#/marketplace', {
			onBeforeLoad() {
				cy.window().then((win) => {
					win.NewfoldRuntime.capabilities.canAccessGlobalCTB = true;
				});
			}
		});
		cy.wait('@products');
	});

	it('Button has CTB Attributes', () => {
		cy.get('#marketplace-item-a1ff70f1-9670-4e25-a0e1-a068d3e43a45')
			.scrollIntoView()
			.should('exist')
			.should('be.visible');
		cy.get('.nfd-button--primary[data-action="load-nfd-ctb"]')
			.should('have.attr', 'data-ctb-id')
			.and('equal', '57d6a568-783c-45e2-a388-847cff155897');
	});

	it('CTB modal is functional', () => {
		cy.intercept({
			method: 'GET',
			url: /newfold-ctb(\/|%2F)v2(\/|%2F)ctb/,
		}, ctbGET ).as('ctbGET');		

		cy.get('body').should('not.have.class', 'noscroll');

		cy.get('[data-action="load-nfd-ctb"]')
			.scrollIntoView()
			.click();
		// wait for intercept with data
		cy.wait('@ctbGET');

		// check body for noscroll class
		cy.get('body').should('have.class', 'noscroll');

		// check for modal should be.visible
		cy.get('#nfd-ctb-container').should('exist');
		cy.get('.global-ctb-modal-content')
			.scrollIntoView()
			.should('be.visible');

		//verify iframe content is visible
		cy.get('.global-ctb-modal-content iframe')
			.should('be.visible');


		// check that cancel button closes modal
		cy.get('.global-ctb-modal-close').click({force:true});
		cy.wait(200);

		// confirm modal is closed
		cy.get('body').should('not.have.class', 'noscroll');
		cy.get('#nfd-ctb-container').should('have.attr', 'aria-hidden').and('equal', 'true');
		cy.get('.global-ctb-modal-content').should('not.be.visible');

		// reopen
		cy.get('[data-action="load-nfd-ctb"]').click();
		cy.wait(100);
		cy.get('.global-ctb-modal-content')
			.scrollIntoView()
			.should('be.visible');

		// confirm modal closes when overlay is clicked
		cy.get('.global-ctb-modal-overlay').click({force:true});
		cy.wait(100);
		cy.get('.global-ctb-modal-content').should('not.be.visible');
	});

});