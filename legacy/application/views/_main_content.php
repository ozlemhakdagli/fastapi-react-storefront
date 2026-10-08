
				<div class="col-sm-9 padding-right">
					<div class="features_items"><!--features_items-->
						<h2 class="title text-center">Yeni Ürünler</h2>
							<?php
								foreach($urunler as $rs)
								{
								?>
						<div class="col-sm-4">
					
							<div class="product-image-wrapper">
							
								<div class="single-products">
										<div class="productinfo text-center">
											<img src="<?=base_url()?>uploads/<?=$rs->resim?>" alt=""  width="100" height="100"/>
											<br>
											<br>
											<b><?=$rs->adi?></b>
											<h2><?=$rs->sfiyat?> ₺</h2>
											<dl>
											
											<dd><button><a href="<?=base_url()?>home/urun_detay/<?=$rs->Id?>"></i>Ürün Detayı</a></button></dd>
											
											</dl>
										</div>
									</div>
				
								</div>
			
								
							</div>
							<?php
								}
							?>	
						</div>
						
						
						
				
						
						
					</div><!--features_items-->
					
									
					
					
				</div>
			</div>
		</div>
	</section>