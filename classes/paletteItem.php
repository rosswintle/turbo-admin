<?php

class paletteItem {

	public $title;

	public $pagePath;

	public $parentTitle;

	public function __construct($title, $pagePath, $parentTitle)
	{
		$this->title = $title;
		$this->pagePath = $pagePath;
		$this->parentTitle = $parentTitle;
	}

}
