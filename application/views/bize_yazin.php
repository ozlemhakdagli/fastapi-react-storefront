<div class="row">  	
	    		<div class="col-sm-8">
	    			<div class="contact-form">
	    				<h2 class="title text-center">Bize Yazın</h2>
									  <?php if ($this->session->flashdata('sonuc')) 
			  { ?>
			  <div class="alert alert-success alert-dismissible">
                <button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('sonuc')?>
                <i class="icon fa fa-check"></i> <?=$this->session->flashdata('email_sent')?>
              </div>
			  <?php } ?>
			  <script>
			  function validateForm() {
					
						if (document.forms["myForm"]["adsoy"].value == "") {
						alert("Adsoy alanı boş olmamalıdır.");
        			return false;
				}
				if (document.forms["myForm"]["tel"].value == "") {
						alert("Telefon alanı boş olmamalıdır.");
        			return false;
				}
				if (document.forms["myForm"]["email"].value == "") {
						alert("Email alanı boş olmamalıdır.");
        			return false;
				}if (document.forms["myForm"]["konu"].value == "") {
						alert("Konu alanı boş olmamalıdır.");
        			return false;
				}
				if (document.forms["myForm"]["mesaj"].value == "") {
						alert("Mesaj alanı boş olmamalıdır.");
        			return false;
				}
			}
			  </script>
	    				<div class="status alert alert-success" style="display: none"></div>
				    	<form id="main-contact-form" name="myForm" class="contact-form row"  onsubmit="return validateForm()" action="<?=base_url()?>bize_yazin/mesaj_ekle"name="contact-form" method="post">
				            <div class="form-group col-md-6">
				               <input type="text" name="adsoy" class="form-control" required="required" placeholder="Adınızı ve soyadınızı giriniz.">
				            </div>
							<div class="form-group col-md-6">
				                <input type="text" name="tel" class="form-control" required="required" placeholder="Telefon giriniz.">
				            </div>
				            <div class="form-group col-md-6">
				                <input type="email" name="email" class="form-control" required="required" placeholder="Email adresinizi giriniz.">
				            </div>
				            <div class="form-group col-md-12">
				                <input type="text" name="konu" class="form-control" required="required" placeholder="Konu giriniz.">
				            </div>
				            <div class="form-group col-md-12">
				                <textarea name="mesaj" id="message" required="required" class="form-control" rows="8" placeholder="Lütfen mesajınızı buraya yazınız."></textarea>
				            </div>                        
				            <div class="form-group col-md-12">
				                <input type="submit" name="submit" class="btn btn-primary pull-right" value="Gönder">
				            </div>
				        </form>
	    			</div>
	    		</div><br>
				 
	    		<div class="col-sm-4">
	    			<div class="contact-info">
	    				
	    				<div class="social-networks">
	    					<h2 class="title text-center">Social Networking</h2>
							<ul>
								<li>
									<a href="#"><i class="fa fa-facebook"></i></a>
								</li>
								<li>
									<a href="#"><i class="fa fa-twitter"></i></a>
								</li>
								<li>
									<a href="#"><i class="fa fa-google-plus"></i></a>
								</li>
								<li>
									<a href="#"><i class="fa fa-youtube"></i></a>
								</li>
							</ul>
	    				</div>
	    			</div>
    			</div>  <div class="col-sm-8">
	    			<div class="contact-info">
	    				<h2 class="title text-center">İletişim Bilgileri</h2>
	    				<address>
							<b>Adres :</b><?=$veri[0]->adres?><br>
							<b>Tel :</b><?=$veri[0]->tel?><br>
	    					<b>Not :</b><?=$veri[0]->iletisim?>
	    				</address>
	    				
	    			</div>
    			</div> 
				
	    	</div>  