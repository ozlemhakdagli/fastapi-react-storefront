
				<div class="col-sm-9 padding-right">
					<div class="features_items"><!--features_items-->
						<h2 class="title text-center"><?=$veriler[0]->turadi ?> Markası İle İlgili Ürünler</h2>
						<?php
								foreach($veriler as $rs)
								{
								?>
						<div class="col-sm-4">
						
							<div class="product-image-wrapper">
							
								<div class="single-products">
								
								
							
										<div class="productinfo text-center">
											<img src="<?=base_url()?>uploads/<?=$rs->resim?>" alt="" width="100" height="100" />
											
											<br>
											<br>
											<p><b><?=$rs->adi?></b></p>
											<h2><?=$rs->sfiyat?> ₺</h2>
											<dl>
											<dd><button><a href="<?=base_url()?>home/urun_detay/<?=$rs->Id?>"></i>Ürün Detayı</a></button></dd>
											<br>
											
											
											</dl>
										</div>
										
								</div>
			
								
							</div>
							
						</div>
						
						
						<?php
								}
							?>
				
						
						
					</div><!--features_items-->
					
									
					
					
				</div>
			</div>
		</div>
	</section>