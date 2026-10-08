
<div class="col-sm-9 padding-right">
					<div class="product-details"><!--product-details-->
						<div class="col-sm-5">
							<div class="view-product">
								
								 <img src="<?php echo base_url()?>uploads/<?=$urun[0]->resim?>" alt="" />
								
							</div>
							<div id="similar-product" class="carousel slide" data-ride="carousel">
								
								  <!-- Wrapper for slides -->
									<div class="carousel-inner">
							<div class="item active">
							
								<div class="col-sm-6">
									<img src="<?php echo base_url()?>uploads/<?=$urun[0]->resim?>"   width="300" height="100" alt=""  />
									
								</div>
							</div>
							<?php foreach($veriler as $rs){ ?>
							<div class="item">
								
								<div class="col-sm-6">
									<img src="<?=base_url()?>uploads/<?=$rs->resim?>" width="300" height="100"  alt="" />
									
								</div>
							</div>
							<?php }?>
							
							
						</div>

								  <!-- Controls -->
								  <a class="left item-control" href="#similar-product" data-slide="prev">
									<i class="fa fa-angle-left"></i>
								  </a>
								  <a class="right item-control" href="#similar-product" data-slide="next">
									<i class="fa fa-angle-right"></i>
								  </a>
							</div>
							

						</div>
						
						<div class="col-sm-7">
						<?php if ($this->session->flashdata('urun')) 
			  { ?>
			   <h2><b><?=$this->session->flashdata('urun')?></b></h2>
             
             
			  <?php } ?>  
							<div class="product-information"><!--/product-information-->
							<?php if($urun[0]->durum == "yeni"){ ?>
								<img src="<?php base_url(); ?>/assets/images/product-details/new.jpg" class="newarrival" alt="" />
							<?php } ?>
								<h2><?=$urun[0]->adi?></h2>
								<p><b>Kategorisi :</b><?=$kat[0]->katadi?></p>
								<p><b>Türü :</b> <?=$kat[0]->turadi?></p>
								<p><b>Kod :  </b> <?=$urun[0]->kodu?></p>
								<span>
									<span><b>Fiyatı :</b><?=$urun[0]->sfiyat ?>₺</span>
									
									<form action="<?=base_url()?>home/sepete_ekle/<?=$urun[0]->Id?>" method="post" >
									<label>Adet :</label><input type="text" name="miktar" value="1" /><br><br>
									
									<button type="submit" class="btn btn-fefault cart">
										<i class="fa fa-shopping-cart"></i>SEPETE EKLE</button>
										
									
									</form>
								</span>
								<p><b>Açıklama</b> <?=$urun[0]->uzun_aciklama ?></p>
								
								
								
							</div><!--/product-information-->
							
						</div>
						
					</div><!--/Response-area-->
														
					<div class="replay-box">
						<div class="row">
							<div class="col-sm-4">
								<h2>Yorum Yapınız</h2>
								<form action="<?=base_url()?>home/yorumekle/<?=$urun[0]->Id?>" method="post">
									<div class="blank-arrow">
										<label>Ad Soyad:</label>
									</div>
									<span>*</span>
									<input type="text" name="adsoy" required  placeholder="Adınızı ve soyadını giriniz">
									<div class="blank-arrow">
										<label>Email Addresi</label>
									</div>
									<span>*</span>
									<input type="email" name="email" required  placeholder="Email adresinizi giriniz">
									
									
								
							</div>
							<div class="col-sm-8">
								<div class="text-area">
									<div class="blank-arrow">
										<label>Yorumunuz</label>
									</div>
									<span>*</span>
									<textarea name="yorum" rows="11"></textarea>
									 <button type="submit"class="btn btn-primary" >Gönder</button>
								</div>
							</div>
						</div></form>
					</div>
					
					<div class="response-area">
						<h2>YORUMLAR</h2>
						<ul class="media-list">
						<?php foreach($yorumlar as $rs) { ?>
							<li class="media">																
								<div class="media-body">
									<ul class="sinlge-post-meta">
										<li><i class="fa fa-user"></i><?=$rs->adsoy?></li>
										
										<li><i class="fa fa-calendar"></i><?=$rs->tarih?></li>
									</ul>
									<p><?=$rs->yorum?></p>
									
								</div>
							</li>
						<?php } ?>
							
						</ul>					<!--/product-details-->