

	<section>
		
			<div class="row">
				
				<div class="col-sm-7">
					<div class="blog-post-area">
						<h2 class="title text-center">Üyelik Bilgilerim</h2>
						<div class="single-blog-post">
							
							
								


				
				
			
					<div class="signup-form"><!--sign up form-->
					
						
						<form action="<?=base_url()?>MusteriLogin/uye_guncelle/" method="post">
						
							<b>Ad Soyad:</br><input type="text" name="AdiSoyadi" value="<?=$this->session->uye_oturum["adsoy"]?>">
							Email:<input type="email" name="email" readonly value="<?=$this->session->uye_oturum["email"]?>"/>
							Şifre:<input type="password" name="sifre" value="<?=$this->session->uye_oturum["sifre"]?>" />
							Adres:<input type="text" name="adres" value="<?=$this->session->uye_oturum["adres"]?>"/>
							Telefon:<input type="text" name="tel" value="<?=$this->session->uye_oturum["tel"]?>"/>
							Yetki:<?=$this->session->uye_oturum["yetki"]?> <br>
							Durum:<?=$this->session->uye_oturum["durum"]?> <br>
							Üye Olma Tarihi :<?=$this->session->uye_oturum["tarih"]?> 
							<br>
							<br>
							<button type="submit" class="btn btn-default"> Güncelle </button>
						</form>
						
					</div><!--/sign up form-->
				
			
	


	
						</div>
					</div><!--/blog-post-area-->

				

					<div class="socials-share">
						<a href=""><img src="images/blog/socials.png" alt=""></a>
					</div><!--/socials-share-->

					
				</div>	
			</div>
		
	</section>
	

  

</body>
</html>