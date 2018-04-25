
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?=$veri[0]->aciklama?>">
	<meta name="keywords" content="<?=$veri[0]->keywords?>">
    <meta name="author" content="">
   
    <?php if(!($sayfa==NULL)){ ?>
    <title><?=$sayfa?> || <?=$veri[0]->adi?></title>
    <?php }  else { ?>
    <title><?=$veri[0]->adi?></title>
    <?php } ?>
    
    <link href="<?php echo base_url(); ?>assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>assets/css/font-awesome.min.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>assets/css/prettyPhoto.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>assets/css/price-range.css" rel="stylesheet">
    <link href="<?php echo base_url(); ?>assets/css/animate.css" rel="stylesheet">
	<link href="<?php echo base_url(); ?>assets/css/main.css" rel="stylesheet">
	<link href="<?php echo base_url(); ?>assets/css/responsive.css" rel="stylesheet">

    <!--[if lt IE 9]>
    <script src="js/html5shiv.js"></script>
    <script src="js/respond.min.js"></script>
    <![endif]-->       
    <link rel="shortcut icon" href="<?php echo base_url(); ?>assets/images/ico/favicon.ico">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="<?php echo base_url(); ?>assets/images/ico/apple-touch-icon-144-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="<?php echo base_url(); ?>assets/images/ico/apple-touch-icon-114-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="<?php echo base_url(); ?>assets/images/ico/apple-touch-icon-72-precomposed.png">
    <link rel="apple-touch-icon-precomposed" href="<?php echo base_url(); ?>assets/images/ico/apple-touch-icon-57-precomposed.png">
</head><!--/head-->

<body>
	<header id="header"><!--header-->
		<div class="header_top"><!--header_top-->
			<div class="container">
				<div class="row">
					
					<div class="col-sm-12">
						<div class="social-icons pull-right">
							<ul class="nav navbar-nav">
							<li><a href="#"><i class="fa fa-phone"></i><?=$Veri[0]->tel?></a></li>
								<li><a href="#"><i class="fa fa-envelope"></i><?=$Veri[0]->email?></a></li>
								
							</ul>
						</div>
					</div>
					
				</div>
			</div>
		</div><!--/header_top-->
		
		<div class="header-middle"><!--header-middle-->
			<div class="container">
				<div class="row">
					<div class="col-sm-12">
						<div class="logo pull-left">
							<a href="<?=base_url()?>"><img src="<?=base_url()?>uploads/logo.png" alt=""  width="250"/></a>
						</div>
						<div class="shop-menu pull-right">
							<ul class="nav navbar-nav">
								<?php
							    $uyepanel=null;
							    $sepetim=null;
                                if($menu=="uyepanel")
							        $uyepanel="active";
							   if($menu=="sepetim")
							        $sepetim="active";
									if(!$this->session->uye_oturum){ ?>
								<li><a href="<?=base_url()?>musteriLogin"><i class="fa fa-lock"></i> Giriş Yap</a></li>
								<li><a href="<?=base_url()?>musteriLogin/yeni_uye"><i class="fa fa-user"></i>Kayıt ol</a></li>
									<?php } else { ?>
								<li>  <a href="<?=base_url()?>home/uyepanel/"class="<?=$uyepanel?>"><b>Hoşgeldin</b> <br><i><?=$this->session->uye_oturum["adsoy"]?></i></a></li>
								<li><a href="<?=base_url()?>home/sepetim/"class="<?=$sepetim?>"><i class="fa fa-shopping-cart"></i> Sepetim</a></li>
								<li><a href="<?=base_url()?>musteriLogin/log_out"><i class="fa fa-lock"></i> Çıkış Yap</a></li>
									<?php } ?>
							</ul>
						</div>
						
					</div>
					
				</div>
			</div>
		</div><!--/header-middle-->
	
		<div class="header-bottom"><!--header-bottom-->
			<div class="container">
				<div class="row">
					<div class="col-sm-9">
						<div class="navbar-header">
							<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">
								<span class="sr-only">Toggle navigation</span>
								<span class="icon-bar"></span>
								<span class="icon-bar"></span>
								<span class="icon-bar"></span>
							</button>
						</div>
						<div class="mainmenu pull-left">
							<ul class="nav navbar-nav collapse navbar-collapse">
							    <?php
							    $anasayfa=null;
							    $urunler=null;
							    $hakkimizda=null;
							    $iletisim=null;
							    $uyepanel=null;
							    if($menu=="anasayfa")
							        $anasayfa="active";
							    if($menu=="hakkimizda")
							        $hakkimizda="active";
							    if($menu=="urunler")
							        $urunler="active";
							    if($menu=="iletisim")
							        $iletisim="active";
                                if($menu=="uyepanel")
							        $uyepanel="active";
							    ?>
								<li><a href="<?=base_url()?>" class="<?=$anasayfa?>">Anasayfa</a></li>
								<li><a href="<?=base_url()?>home/urunler" class="<?=$urunler?>">Ürünler</a></li>
								
								<li><a href="<?=base_url()?>home/hakkimizda" class="<?=$hakkimizda?>">Hakkımızda</a></li>
								
								<li><a href="<?=base_url()?>Bize_yazin" class="<?=$iletisim?>">İletişim</a></li>
								
							</ul>
						</div>
					</div>
					
				</div>
			</div>
		</div><!--/header-bottom-->
	</header><!--/header-->