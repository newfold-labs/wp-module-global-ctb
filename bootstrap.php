<?php

use NewfoldLabs\WP\ModuleLoader\Container;
use NewfoldLabs\WP\Module\GlobalCTB\CTB;
use function NewfoldLabs\WP\ModuleLoader\register;

if ( function_exists( 'add_action' ) ) {

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
