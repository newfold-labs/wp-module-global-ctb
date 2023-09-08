<?php
namespace NewfoldLabs\WP\Module\GlobalCTB;

use NewfoldLabs\WP\ModuleLoader\Container;
use NewfoldLabs\WP\Module\Data\SiteCapabilities;
use function NewfoldLabs\WP\ModuleLoader\container;

/**
 * This class adds click to buy functionality.
 **/
class CTB {

	/**
	 * Dependency injection container.
	 *
	 * @var Container
	 */
	protected $container;


	/**
	 * Constructor.
	 *
	 * @param Container $container The module container.
	 */
	public function __construct( Container $container ) {
		$this->container = $container;

		// Module functionality goes here
		add_action( 'rest_api_init', array( CTBApi::class, 'registerRoutes' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'ctb_scripts' ) );
		add_action( 'admin_footer', array( $this, 'ctb_footer' ) );
	}

	/**
	 * Enqueue admin scripts
	 *
	 * @return void
	 */
	public function ctb_scripts() {
		$assetsDir = container()->plugin()->url . 'vendor/newfold-labs/wp-module-global-ctb/includes/assets/';

		// load the a11y dialog lib
		wp_register_script(
			'a11y-dialog',
			$assetsDir . 'a11y-dialog.min.js',
			array(),
			'7.4.0',
			false
		);

		// load ctb script
		wp_enqueue_script(
			'newfold-global-ctb',
			$assetsDir . 'ctb.js',
			array( 'a11y-dialog' ),
			container()->plugin()->version,
			true
		);

		// Capability check for CTB support
		$capability = new SiteCapabilities();
		$canCTB     = $capability->get( 'canCTB' );

		// Inline script for global vars for ctb
		wp_localize_script(
			'newfold-global-ctb', // script handle
			'nfdgctb',      // js object
			array(
				'canCTB' => $canCTB,
			)
		);

		// Styles
		wp_enqueue_style(
			'newfold-global-ctb-style',
			$assetsDir . 'ctb.css',
			array(),
			container()->plugin()->version
		);
	}

	/**
	 * Add container to footer for modal components
	 *
	 * @return void
	 */
	public function ctb_footer() {
		echo "<div id='nfd-ctb-container' aria-hidden='true'></div>";
	}
}
