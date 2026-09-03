<?php

use NewfoldLabs\WP\ModuleLoader\Container;
use NewfoldLabs\WP\Module\GlobalCTB\CTB;
use function NewfoldLabs\WP\ModuleLoader\register;

if ( function_exists( 'add_action' ) ) {

	if ( ! defined( 'NFD_MODULE_GLOBAL_CTB_DIR' ) ) {
		define( 'NFD_MODULE_GLOBAL_CTB_DIR', __DIR__ );
	}

	add_action(
		'init',
		static function () {
			load_plugin_textdomain(
				'wp-module-global-ctb',
				false,
				NFD_MODULE_GLOBAL_CTB_DIR . '/languages'
			);
		}
	);

	add_action(
		'plugins_loaded',
		function () {
			register(
				array(
					'name'     => 'global-ctb',
					'label'    => __( 'global-ctb', 'wp-module-global-ctb' ),
					'callback' => function ( Container $container ) {
						return new CTB( $container );
					},
					'isActive' => true,
					'isHidden' => true,
				)
			);
		}
	);

}
