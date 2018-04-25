<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>Teknopart Üye Ol</title>
    <link href="<?=base_url()?>assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/font-awesome.min.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/prettyPhoto.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/price-range.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/animate.css" rel="stylesheet">
	<link href="<?=base_url()?>assets/css/main.css" rel="stylesheet">
	<link href="<?=base_url()?>assets/css/responsive.css" rel="stylesheet">
    <!--[if lt IE 9]>
    <script src="js/html5shiv.js"></script>
    <script src="js/respond.min.js"></script>
    <![endif]-->       
    <link rel="shortcut icon" href="images/ico/favicon.ico">
    <link rel="apple-touch-icon-precomposed" sizes="144x144" href="images/ico/apple-touch-icon-144-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="114x114" href="images/ico/apple-touch-icon-114-precomposed.png">
    <link rel="apple-touch-icon-precomposed" sizes="72x72" href="images/ico/apple-touch-icon-72-precomposed.png">
    <link rel="apple-touch-icon-precomposed" href="images/ico/apple-touch-icon-57-precomposed.png">
</head><!--/head-->

<body>
	
	
	<section id="form"><!--form-->
		<div class="container">
			<div class="row">
				<div class="col-sm-4 col-sm-offset-3">
				
				<div class="col-sm-10">
					<div class="signup-form"><!--sign up form-->
					
						<h4> <b>Teknopart Üye ol Formu</b></h4>
						<form action="<?=base_url()?>MusteriLogin/yeniuye_ol" method="post">
							Ad Soyad: <input type="text" name="AdiSoyadi"placeholder="Adınızı ve soyadınızı giriniz"/>
							Email:<input type="email" name="email" placeholder="Email adresinizi giriniz"/>
							Şifre:<input type="password" name="sifre" placeholder="Şifrenizi giriniz"/>
							Adres:<input type="text" name="adres" placeholder="Adresinizi giriniz"/>
							Telefon:<input type="text" name="tel" placeholder="Telefonunuzu giriniz"/>
							
							<button type="submit" class="btn btn-default"> Üye Ol </button>
						</form>
					</div><!--/sign up form-->
				</div>
			</div>
		</div>
		</div>
	</section><!--/form-->
	
	


  
    <script src="<?=base_url()?>assets/js/jquery.js"></script>
	<script src="<?=base_url()?>assets/js/price-range.js"></script>
    <script src="<?=base_url()?>assets/js/jquery.scrollUp.min.js"></script>
	<script src="<?=base_url()?>assets/js/bootstrap.min.js"></script>
    <script src="<?=base_url()?>assets/js/jquery.prettyPhoto.js"></script>
    <script src="<?=base_url()?>assets/js/main.js"></script>
</body>
</html>