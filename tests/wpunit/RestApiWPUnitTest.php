<?php

namespace NewfoldLabs\WP\Module\GlobalCTB;

/**
 * REST API wpunit tests.
 *
 * @coversDefaultClass \NewfoldLabs\WP\Module\GlobalCTB\CTBApi
 */
class RestApiWPUnitTest extends \lucatume\WPBrowser\TestCase\WPTestCase {

	/**
	 * Verifies that rest_api_init registers newfold-ctb REST routes.
	 *
	 * Routes must be registered on rest_api_init. Register the controller
	 * inside that action so WordPress does not trigger an incorrect usage notice.
	 *
	 * @return void
	 */
	public function test_rest_api_init_registers_ctb_routes() {
		add_action(
			'rest_api_init',
			function () {
				CTBApi::registerRoutes();
			}
		);
		do_action( 'rest_api_init' );
		$server = rest_get_server();
		$routes = $server->get_routes();
		$found  = array_filter(
			array_keys( $routes ),
			function ( $route ) {
				return strpos( $route, 'newfold-ctb' ) !== false;
			}
		);
		$this->assertNotEmpty( $found, 'Expected newfold-ctb routes to be registered' );
	}
}
