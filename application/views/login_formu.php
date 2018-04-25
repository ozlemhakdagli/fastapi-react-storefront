<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="">
	<meta name="keywords" content="">
    <meta name="author" content="">
    <title>Teknopart Üye Girişi</title>
    <link href="<?=base_url()?>assets/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/font-awesome.min.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/prettyPhoto.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/price-range.css" rel="stylesheet">
    <link href="<?=base_url()?>assets/css/animate.css" rel="stylesheet">
	<link href="<?=base_url()?>assets/css/main.css" rel="stylesheet">
	<link href="<?=base_url()?>assets/css/responsive.css" rel="stylesheet">

</head><!--/head-->

<body>
	
	         
	<section id="form"><!--form-->
		<div class="container">
		
				 
				<div class="col-sm-4 col-sm-offset-3">
				
					<div class="login-form"><!--login form-->
					<?php if ($this->session->flashdata('login_hata')) 
			  { ?>
			   <h2><b><?=$this->session->flashdata('login_hata')?></b></h2>
             <h2><b><?=$this->session->flashdata('mesaj')?></b></h2>
             
			  <?php } ?>
						<img src="uploads/logo.png" alt=""  width="250" align="center"/>
					    <h3 align="center">  <b>Üye Giriş Paneli</b> </h3>
						 <form action="<?=base_url()?>MusteriLogin/login_ol" method="post">
							<input type="email"  name="email" placeholder="Lütfen email adresinizi giriniz" />
							<input type="password" name="sifre" placeholder="Lütfen şifrenizi adresinizi giriniz" />
							
							<button type="submit" class="btn btn-default">Giriş yap</button>
						</form>
					</div><!--/login form-->
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