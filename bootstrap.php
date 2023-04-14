<?php

use NewfoldLabs\WP\Module\CTB\CTB;
use NewfoldLabs\WP\ModuleLoader\Container;
use function NewfoldLabs\WP\ModuleLoader\register;

if ( function_exists( 'add_action' ) ) {

	add_action(
		'plugins_loaded',
		function () {

			register(
				array(
					'name'     => 'ctb',
					'label'    => __( 'ctb', 'newfold-ctb-module' ),
					'callback' => function ( Container $container ) {
						require_once __DIR__ . '/includes/Ctb.php';
						new CTB( $container );
					},
					'isActive' => true,
					'isHidden' => false,
				)
			);

		}
	);

}
