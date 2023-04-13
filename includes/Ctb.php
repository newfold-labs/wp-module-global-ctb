<?php
namespace NewfoldLabs\WP\Module\CTB;

use NewfoldLabs\WP\ModuleLoader\Container;
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
		$assetsDir = container()->plugin()->url . 'vendor/newfold-labs/wp-module-ctb/includes/assets/';

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
			'newfold-ctb',
			$assetsDir . 'ctb.js',
			array( 'a11y-dialog' ),
			container()->plugin()->version,
			true
		);

		// Inline script for global vars
		wp_localize_script(
			'newfold-ctb',
			'nfdctb',
			array(
				'restApiUrl'   => esc_url_raw( get_home_url() . '/index.php?rest_route=/' ),
				'restApiNonce' => wp_create_nonce( 'wp_rest' ),
			)
		);

		// Calculate and add admin inline values
		$token         = get_option( 'nfd_data_token' );
		$customerData  = container()->plugin()->customer;
		$hasToken      = ! empty( $token );
		$hasCustomerId = ! empty( $customerData ) && ! empty( $customerData['customer_id'] );
		$showCTBs      = $hasToken && $hasCustomerId;
		$isJarvis      = get_option( 'bh_platform' ) === 'jarvis' ? 'true' : null;

		wp_add_inline_script( 'newfold-ctb', 'window.bluehostWpAdminUrl="' . \admin_url() . '";', 'before' );
		wp_add_inline_script( 'newfold-ctb', 'window.nfBrandPlatform="' . \get_option( 'mm_brand' ) . '";', 'before' );
		wp_add_inline_script( 'newfold-ctb', 'window.nfdIsJarvis="' . $isJarvis . '";', 'before' );
		wp_add_inline_script( 'newfold-ctb', 'window.nfdRestRoot="' . \get_home_url() . '/index.php?rest_route=";', 'before' );
		wp_add_inline_script( 'newfold-ctb', $showCTBs ? 'window.nfdConnected=true;' : 'window.nfdConnected=false;', 'before' );

		// Styles
		wp_enqueue_style(
			'newfold-ctb-style',
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
