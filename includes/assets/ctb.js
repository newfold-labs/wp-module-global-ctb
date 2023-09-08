{

	const loadCtb = (e) => {
		let ctbId = e.target.getAttribute('data-ctb');
		let modal = openModal(e, ctbId);
		let modalWindow = modal.querySelector('.global-ctb-modal-content');
		let modalLoader = modal.querySelector('.global-ctb-loader');
		window.fetch(
			`${ window.nfdplugin.restApiUrl }/newfold-ctb/v2/ctb/${ ctbId }`,
			{
				credentials: 'same-origin',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': window.nfdplugin.restApiNonce,
				},
			}
		)
		.then( response => {
			return response.json();
		}).then( data => {
			// if (data.content) {
				// set the content to an iframe of specified url
				let theframe = document.createElement('iframe');
				theframe.width = "100%";
				theframe.height = "100%";
				// theframe.src = data.content.html;
				theframe.src = 'https://test.hiive.cloud/ctb';
				// modalWindow.appendChild( theframe );
				modalWindow.replaceChild( theframe, modalLoader );
			// } else {
			// 	displayError(modalWindow, 'load');
			// }
		});
	}

	const removeCtbAttrs = () => {
		let ctbContainer = document.getElementById('nfd-global-ctb-container');
		let ctbId = ctbContainer.getAttribute('data-ctb');
		let ctbButton = document.querySelector('[data-ctb="' + ctbId + '"]');
		ctbButton.removeAttribute('data-ctb');
		ctbContainer.removeAttribute('data-ctb');
	}

	const openModal = (e, ctbId) => {
		let modalContent = `
		<div class="global-ctb-modal">
			<div class="global-ctb-modal-overlay" data-a11y-dialog-destroy></div>
			<div role="document" class="global-ctb-modal-content">
				<div class="global-ctb-loader"></div>
			</div>
		</div>
		`;
		let ctbContainer = document.getElementById('nfd-global-ctb-container');
		if (ctbContainer) {
			ctbContainer.innerHTML = modalContent
		} else {
			ctbContainer = document.createElement('div');
			ctbContainer.setAttribute('id', 'nfd-global-ctb-container');
			ctbContainer.innerHTML = modalContent;
			ctbContainer.target.insertAdjacentElement('afterend', nfd-global-ctb-container);
		}

		ctbContainer.setAttribute('data-ctb', ctbId);
		ctbmodal = new A11yDialog(ctbContainer);
		ctbmodal.show();
		document.querySelector('body').classList.add('noscroll');
		
		return ctbContainer;
	}
	
	const closeModal = (e) => {
		ctbmodal.destroy();
		document.querySelector('body').classList.remove('noscroll');
	}

	const displayError = (modalWindow, error) => {
		let message = (error === 'purchase') ? 'complete the transaction' : 'load the product information';
		modalWindow.innerHTML = `<div style="text-align:center;">
			<p>Sorry, we are unable to ${message} at this time.</p>
			<button class="components-button bluehost is-primary" data-a11y-dialog-destroy>Cancel</button>
		</div>`;
		//remove ctb attributes from button so the user can click the link
		removeCtbAttrs();
	}

	window.addEventListener(
		'load',
		() => {
			document.getElementById( 'wpwrap' ).addEventListener( 'click', function( event ) {
				if ( event.target.dataset.ctb ) { // has ctb data attribute
					if ( window.nfdgctb.canCTB ) { // has token and customer id
						event.preventDefault();
						loadCtb( event );
					} else {
						// do nothing, fallback to href
					}
				}
				if ( event.target.hasAttribute( 'data-a11y-dialog-destroy' ) ) {
					closeModal( event.target );
				}
			});
		}
	);
}
