// <reference types="Cypress" />
const global_ctb_products = require( '../fixtures/global-ctb-products.json' );

describe( 'Click to buy', function () {
	before( () => {
		cy.visit( '/wp-admin/index.php' );
		cy.exec( 'npx wp-env run cli wp transient delete newfold_marketplace', {failOnNonZeroExit: false} );
		cy.intercept(
			{
				method: 'GET',
				url: /newfold-marketplace(\/|%2F)v1(\/|%2F)marketplace/,
			},
			global_ctb_products
		).as( 'global_ctb_products' );

		cy.visit(
			'/wp-admin/admin.php?page=' +
				Cypress.env( 'pluginId' ) +
				'#/marketplace',
			{
				onLoad() {
					cy.window().then( ( win ) => {
						win.NewfoldRuntime.capabilities.canAccessGlobalCTB = true;
					} );
				},
			}
		);

	} );

	it( 'Button has CTB Attributes', () => {
		cy.window().then( ( win ) => {
			cy.log( `NewfoldRuntime.capabilities.canAccessGlobalCTB: ${ win.NewfoldRuntime.capabilities.canAccessGlobalCTB }` )
		} );

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

	it( 'CTB modal opens successfully', () => {
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
	} );

	it( 'CTB iframe dynamic sizing works', () => {
		// Mock the 'frameWidth' and 'frameHeight' message events
		cy.window().then( ( win ) => {
			// 'frameWidth' event
			const widthEvent = new MessageEvent( 'message', {
				data: { type: 'frameWidth', width: '800px' },
				origin: 'http://hiive.com',
			} );
			win.dispatchEvent( widthEvent );

			// 'frameHeight' event
			const heightEvent = new MessageEvent( 'message', {
				data: { type: 'frameHeight', height: '600px' },
				origin: 'http://hiive.com',
			} );
			win.dispatchEvent( heightEvent );
		} );

		// check iframe width and height
		cy.get( '.global-ctb-modal-content iframe' )
			.should( 'have.css', 'width', '800px' )
			.and( 'have.css', 'height', '600px' );
	} );

	it( 'X button closes CTB modal', () => {
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
