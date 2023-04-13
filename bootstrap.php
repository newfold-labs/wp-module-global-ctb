<?php

use NewfoldLabs\WP\Module\CTB\CTB;
use NewfoldLabs\WP\ModuleLoader\Container;
use function NewfoldLabs\WP\ModuleLoader\register;

if ( function_exists( 'add_action' ) ) {

	add_action(
		'plugins_loaded',
		function () {

			register(
				[
					'name'     => 'ctb',
					'label'    => __( 'ctb', 'newfold-ctb-module' ),
					'callback' => function ( Container $container ) {
						new CTB( $container );
					},
					'isActive' => true,
					'isHidden' => false,
				]
			);

		}
	);

}