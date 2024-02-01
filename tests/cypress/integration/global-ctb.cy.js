// <reference types="Cypress" />
const productsFixture = require( '../fixtures/products.json' );

describe( 'Click to buy', function () {
	before( () => {
		cy.exec('npx wp-env run cli wp transient delete newfold_marketplace');
		cy.intercept(
			{
				method: 'GET',
				url: /newfold-marketplace(\/|%2F)v1(\/|%2F)marketplace/,
			},
			productsFixture
		);

		cy.visit(
			'/wp-admin/admin.php?page=' +
				Cypress.env( 'pluginId' ) +
				'#/marketplace',
			{
				onBeforeLoad() {
					cy.window().then( ( win ) => {
						win.nfdctb.supportsCTB = false;
						win.NewfoldRuntime.capabilities.canAccessGlobalCTB = true;
					} );
				},
			}
		);
	} );

	it( 'Button has CTB Attributes', () => {
		cy.window().then(
			(win)=>{
				cy.log(`NewfoldRuntime.capabilities.canAccessGlobalCTB: ${win.NewfoldRuntime.capabilities.canAccessGlobalCTB}`)
			}
		);

		cy.get( '#marketplace-item-a1ff70f1-9670-4e25-a0e1-a068d3e43a45' )
			.scrollIntoView()
			.should( 'exist' )
			.should( 'be.visible' );
		cy.get( '.nfd-button--primary[data-action="load-nfd-ctb"]' )
			.should(
				'have.attr',
				'data-ctb-id',
				'57d6a568-783c-45e2-a388-847cff155897'
			)
			.should( 'have.attr', 'target', '_blank' );
	} );

	it( 'CTB modal is functional', () => {
		cy.intercept(
			{
				method: 'GET',
				url: /newfold-ctb(\/|%2F)v2(\/|%2F)ctb/,
			},
			{
				body: {
					url: 'https://example.com',
				},
			}
		);

		cy.get( 'body' ).should( 'not.have.class', 'noscroll' );

		cy.get( '[data-action="load-nfd-ctb"]' ).scrollIntoView().click();

		// wait for intercept with data
		cy.wait( 1000 );

		// check body for noscroll class
		cy.get( 'body' ).should( 'have.class', 'noscroll' );

		// check for modal should be.visible
		cy.get( '#nfd-global-ctb-container' ).should( 'exist' );
		cy.get( '.global-ctb-modal-content' )
			.scrollIntoView()
			.should( 'be.visible' );

		// verify iframe content is visible
		cy.get( '.global-ctb-modal-content iframe' )
			.should( 'have.attr', 'src', 'https://example.com' )
			.should( 'be.visible' );

		// check that cancel button closes modal
		cy.get( '.global-ctb-modal-close' ).click( { force: true } );
		cy.wait( 200 );

		// confirm modal is closed
		cy.get( 'body' ).should( 'not.have.class', 'noscroll' );
		cy.get( '#nfd-global-ctb-container' )
			.should( 'have.attr', 'aria-hidden' )
			.and( 'equal', 'true' );
		cy.get( '.global-ctb-modal-content' ).should( 'not.be.visible' );
	} );

	it( 'CTB fallback is functional', () => {
		cy.intercept(
			{
				method: 'GET',
				url: /newfold-ctb(\/|%2F)v2(\/|%2F)ctb/,
			},
			{
				statusCode: 500,
			}
		);

		cy.get( 'body' ).should( 'not.have.class', 'noscroll' );

		cy.get( '[data-action="load-nfd-ctb"]' ).scrollIntoView().click();

		// wait for intercept
		cy.wait( 1000 );

		// confirm modal is closed
		cy.get( 'body' ).should( 'not.have.class', 'noscroll' );
		cy.get( '#nfd-global-ctb-container' )
			.should( 'have.attr', 'aria-hidden' )
			.and( 'equal', 'true' );
		cy.get( '.global-ctb-modal-content' ).should( 'not.be.visible' );
	} );
} );
